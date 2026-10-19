"use client";

import { useId, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Button,
  Card,
  DashIcon,
  FormRow,
  PageHeader,
  Segmented,
  Stepper,
  Toggle,
  btnSecondary,
  fInput,
} from "@/components/ui";
import { createPack, loadStoreProducts, updatePack } from "@/app/d/packs-management/action";
import {
  PACK_LIMITS,
  draftLines,
  emptyDraft,
  hasDraftErrors,
  newDraftItem,
  packToDraft,
  packUpdatePatch,
  validatePackDraft,
} from "../draft";
import { pricePack } from "../pricing";
import { formatDa } from "../rows";
import {
  PACK_CREATE_STATUSES,
  PACK_EDIT_STATUSES,
  type Pack,
  type PackDraft,
  type PackDraftErrors,
  type PackDraftItem,
  type PackLineProduct,
  type PackProductOption,
  type PackStoreOption,
} from "../types";
import { PackImageField } from "./pack-image-field";
import { PackItemRow } from "./pack-item-row";
import { PackSummary } from "./pack-summary";
import { ProductPicker } from "./product-picker";
import { StoreCard } from "./store-card";
import { StorePicker } from "./store-picker";

const LIST = "/packs-management/all";

export type PackEditorProps =
  | { mode: "create"; stores: PackStoreOption[]; storesError?: string }
  | {
      mode: "edit";
      pack: Pack;
      products: PackProductOption[];
      productsError?: string;
      /**
       * "Reload latest version" after a 409: re-read the pack and restart the editor
       * from it. Defaults to router.refresh() (restarts only if the version moved).
       */
      onReload?: () => void;
    };

const storeOfPack = (pack: Pack): PackStoreOption => ({
  id: pack.storeId,
  name: pack.storeName,
  deliveryFee: pack.storeDeliveryFee,
  status: pack.storeStatus,
  ownerName: pack.merchantName,
  ownerPhone: pack.merchantPhone,
});

/**
 * Staff pack editor — create (pick a store, then its products) or edit (store fixed).
 * Validates live with the same rules the server action re-checks, prices live with
 * the shared pricing mirror, and saves through blink-server. An edit sends only the
 * changed fields, with the pack version it was loaded at. A failed save keeps the
 * draft: a 409 offers a reload, a 404 a way back (the actions don't revalidate on a
 * failure, which would re-render this page under the operator).
 */
export function PackEditor(props: PackEditorProps) {
  const t = useTranslations("packs");
  const router = useRouter();
  const nameId = useId();
  const descriptionId = useId();
  const editing = props.mode === "edit" ? props.pack : null;

  const [initial] = useState<PackDraft>(() => (editing ? packToDraft(editing) : emptyDraft()));
  const [draft, setDraft] = useState<PackDraft>(initial);
  const [store, setStore] = useState<PackStoreOption | null>(() => (editing ? storeOfPack(editing) : null));
  const [products, setProducts] = useState<PackProductOption[]>(props.mode === "edit" ? props.products : []);
  const [productsError, setProductsError] = useState<string | undefined>(
    props.mode === "edit" ? props.productsError : undefined
  );
  const [loadingProducts, startLoading] = useTransition();
  const latestStore = useRef<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [serverError, setServerError] = useState<{ message: string; reason?: "conflict" | "not_found" } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, startSaving] = useTransition();
  const [reloading, startReload] = useTransition();

  const set = (patch: Partial<PackDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const setItems = (fn: (items: PackDraftItem[]) => PackDraftItem[]) => setDraft((d) => ({ ...d, items: fn(d.items) }));

  // Each line's product: live from the store's products, else as the pack resolved it
  // (deleted, or another store's — blink-server refuses those once the items change).
  const lookup = useMemo(() => {
    const map = new Map<string, PackLineProduct>();
    for (const i of editing?.items ?? []) {
      map.set(i.productId, {
        title: i.name,
        image: i.image,
        unit: i.unit,
        price: i.unitPrice,
        issue: i.issue === "bad_quantity" ? null : i.issue,
      });
    }
    for (const p of products) {
      map.set(p.id, { title: p.title, image: p.image, unit: p.unit, price: p.price, issue: p.issue });
    }
    return map;
  }, [editing, products]);

  // An edit is checked (and sent) as its changed fields only, so an untouched broken
  // line doesn't block renaming a pack.
  const patch = editing ? packUpdatePatch(initial, draft) : null;
  const noChanges = !!patch && Object.keys(patch).length === 0;
  const errors: PackDraftErrors = validatePackDraft(patch ?? draft, editing ? "update" : "create");
  const strays = draft.items.some((i) => {
    const p = lookup.get(i.productId);
    return !p || p.issue === "missing" || p.issue === "other_store";
  });
  if ((!patch || patch.items) && strays && !errors.items) errors.items = "items_not_in_store";
  const invalid = hasDraftErrors(errors);
  const shown: PackDraftErrors = showErrors ? errors : {};

  const pricing = pricePack(
    draftLines(draft.items, (id) => lookup.get(id)?.price),
    draft.discountEnabled,
    draft.discountPercent
  );
  const unsellable = draft.items.some((i) => {
    const p = lookup.get(i.productId);
    return !p || p.issue !== null || !(Number.isInteger(i.quantity) && i.quantity > 0);
  });
  const addedIds = new Set(draft.items.map((i) => i.productId));

  function selectStore(next: PackStoreOption) {
    if (next.id === store?.id) return;
    setStore(next);
    setItems(() => []);
    setProducts([]);
    setProductsError(undefined);
    latestStore.current = next.id;
    startLoading(async () => {
      const res = await loadStoreProducts(next.id);
      if (latestStore.current !== next.id) return; // another store was picked meanwhile
      setProducts(res.products);
      setProductsError(res.error);
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setShowErrors(true);
    setServerError(null);
    if (!store || invalid || uploading || saving) return;
    if (editing && patch && noChanges) {
      setServerError({ message: t("editor.no_changes") });
      return;
    }
    startSaving(async () => {
      const res =
        editing && patch
          ? await updatePack(editing.id, patch, editing.updatedAt)
          : await createPack(store.id, draft);
      if (res.error) {
        setServerError({ message: res.error, reason: res.reason });
        // Creating: the store is gone / changed, so re-read the store list. The editor
        // isn't keyed in create mode, so the draft stays.
        if (!editing && res.reason) router.refresh();
        return;
      }
      router.push(LIST);
    });
  }

  const statusKeys: readonly PackDraft["status"][] = editing
    ? initial.status === "under_review"
      ? ["under_review", ...PACK_EDIT_STATUSES]
      : PACK_EDIT_STATUSES
    : PACK_CREATE_STATUSES;
  const statusOptions = statusKeys.map(
    (k) => [k, k === "under_review" ? t("editor.status.keep_review") : t(`status.${k}`)] as [PackDraft["status"], string]
  );
  const steps = { decrease: t("editor.items.decrease"), increase: t("editor.items.increase") };
  const validation = (key?: string) =>
    key ? (
      <p role="alert" className="text-xs text-danger mt-1.5">
        {t(`editor.validation.${key}`)}
      </p>
    ) : null;

  return (
    <form
      onSubmit={submit}
      noValidate
      // Enter in a search box or a stepper must not save the pack: only the button does.
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target instanceof HTMLInputElement) e.preventDefault();
      }}
    >
      <Link
        href={LIST}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-subtext hover:text-text mb-4 transition-colors"
      >
        <DashIcon name="undo" className="w-4 h-4 rtl:-scale-x-100" />
        {t("editor.back")}
      </Link>
      <PageHeader
        title={editing ? t("editor.edit_title") : t("editor.new_title")}
        description={editing ? t("editor.edit_subtitle") : t("editor.new_subtitle")}
        actions={
          <>
            <Link href={LIST} className={btnSecondary}>
              {t("editor.cancel")}
            </Link>
            <Button type="submit" icon="check" loading={saving} disabled={uploading || noChanges}>
              {editing ? t("editor.save") : t("editor.create")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        {/* ── Main column ── */}
        <div className="space-y-5 min-w-0">
          <Card
            title={t("editor.store.title")}
            description={editing ? t("editor.store.fixed") : t("editor.store.description")}
          >
            {props.mode === "edit" && store ? (
              <StoreCard store={store} />
            ) : props.mode === "create" ? (
              <StorePicker
                stores={props.stores}
                value={store}
                onChange={selectStore}
                hasItems={draft.items.length > 0}
                error={props.storesError}
              />
            ) : null}
          </Card>

          <Card title={t("editor.items.title")} description={t("editor.items.description")} bodyClassName="space-y-4">
            {!store ? (
              <p className="text-sm text-subtext">{t("editor.items.pick_store")}</p>
            ) : (
              <>
                {draft.items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-4 text-sm text-subtext text-center">
                    {t("editor.items.empty")}
                  </p>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    {draft.items.map((item, i) => (
                      <PackItemRow
                        key={`${i}-${item.productId}`}
                        item={item}
                        product={lookup.get(item.productId)}
                        error={shown.lines?.[item.productId]}
                        onChange={(next) => setItems((items) => items.map((it, j) => (j === i ? next : it)))}
                        onRemove={() => setItems((items) => items.filter((_, j) => j !== i))}
                      />
                    ))}
                  </div>
                )}
                {validation(shown.items)}
                <ProductPicker
                  products={products}
                  addedIds={addedIds}
                  onAdd={(id) =>
                    setItems((items) =>
                      items.some((i) => i.productId === id) || items.length >= PACK_LIMITS.itemsMax
                        ? items
                        : [...items, newDraftItem(id)]
                    )
                  }
                  full={draft.items.length >= PACK_LIMITS.itemsMax}
                  loading={loadingProducts}
                  error={productsError}
                />
              </>
            )}
          </Card>

          <Card title={t("editor.details.title")}>
            <FormRow
              label={t("editor.details.name")}
              htmlFor={nameId}
              hint={`${draft.name.trim().length}/${PACK_LIMITS.nameMax}`}
            >
              <input
                id={nameId}
                className={`${fInput} ${shown.name ? "border-danger" : ""}`}
                dir="auto"
                value={draft.name}
                maxLength={PACK_LIMITS.nameMax}
                aria-invalid={!!shown.name || undefined}
                placeholder={t("editor.details.name_ph")}
                onChange={(e) => set({ name: e.target.value })}
              />
              {validation(shown.name)}
            </FormRow>
            <FormRow
              label={t("editor.details.description")}
              htmlFor={descriptionId}
              hint={`${draft.description.trim().length}/${PACK_LIMITS.descriptionMax}`}
            >
              <textarea
                id={descriptionId}
                className={`${fInput} min-h-[96px] resize-y ${shown.description ? "border-danger" : ""}`}
                dir="auto"
                value={draft.description}
                maxLength={PACK_LIMITS.descriptionMax}
                aria-invalid={!!shown.description || undefined}
                placeholder={t("editor.details.description_ph")}
                onChange={(e) => set({ description: e.target.value })}
              />
              {validation(shown.description)}
            </FormRow>
            <FormRow label={t("editor.details.image")} className="!mb-0">
              <PackImageField
                value={draft.image}
                onChange={(image) => set({ image })}
                storeId={store?.id ?? null}
                error={shown.image ? t(`editor.validation.${shown.image}`) : undefined}
                onUploadingChange={setUploading}
              />
            </FormRow>
          </Card>

          <Card title={t("editor.offer.title")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold text-text">{t("editor.offer.discount")}</p>
                <p className="text-xs text-subtext mt-0.5">{t("editor.offer.discount_hint")}</p>
              </div>
              <Toggle
                on={draft.discountEnabled}
                label={t("editor.offer.discount")}
                onClick={() => set({ discountEnabled: !draft.discountEnabled })}
              />
            </div>
            {draft.discountEnabled && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Stepper
                  value={draft.discountPercent}
                  min={0}
                  max={PACK_LIMITS.discountMax}
                  label={t("editor.offer.discount_percent")}
                  labels={steps}
                  invalid={!!shown.discount}
                  onChange={(discountPercent) => set({ discountPercent })}
                />
                <span className="text-sm text-subtext">%</span>
                {pricing.savings > 0 && (
                  <span className="text-sm text-success tabular-nums" dir="ltr">
                    -{formatDa(pricing.savings)}
                  </span>
                )}
              </div>
            )}
            {validation(shown.discount)}

            <div className="border-t border-border my-4" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold text-text">{t("editor.offer.free_delivery")}</p>
                <p className="text-xs text-subtext mt-0.5">
                  {store
                    ? t("editor.offer.free_delivery_hint", { fee: formatDa(store.deliveryFee) })
                    : t("editor.offer.free_delivery_pick_store")}
                </p>
              </div>
              <Toggle
                on={draft.freeDelivery}
                label={t("editor.offer.free_delivery")}
                onClick={() => set({ freeDelivery: !draft.freeDelivery })}
              />
            </div>
          </Card>
        </div>

        {/* ── Side column ── */}
        <div className="space-y-5 lg:sticky lg:top-4">
          <Card title={t("editor.status.title")}>
            <Segmented
              options={statusOptions}
              value={draft.status}
              onChange={(status) => set({ status })}
              className="flex-wrap"
            />
            <p className="text-xs text-subtext mt-3">{t(`editor.status.hint_${draft.status}`)}</p>
            {validation(shown.status)}
          </Card>

          <PackSummary
            pricing={pricing}
            deliveryFee={store ? store.deliveryFee : null}
            freeDelivery={draft.freeDelivery}
            hasItems={draft.items.length > 0}
            unsellable={unsellable}
          />

          {serverError ? (
            <div role="alert" className="rounded-xl bg-danger-light p-3 space-y-2.5">
              <p className="text-sm text-danger">{serverError.message}</p>
              {editing && serverError.reason === "conflict" && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon="undo"
                  loading={reloading}
                  onClick={() =>
                    startReload(() => (props.mode === "edit" && props.onReload ? props.onReload() : router.refresh()))
                  }
                >
                  {t("editor.reload")}
                </Button>
              )}
              {editing && serverError.reason === "not_found" && (
                <Link href={LIST} className={btnSecondary}>
                  {t("editor.back")}
                </Link>
              )}
            </div>
          ) : showErrors && invalid ? (
            <p role="alert" className="text-sm text-danger bg-danger-light rounded-xl p-3">
              {t("editor.errors.validation")}
            </p>
          ) : noChanges ? (
            <p className="text-xs text-subtext">{t("editor.no_changes")}</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
