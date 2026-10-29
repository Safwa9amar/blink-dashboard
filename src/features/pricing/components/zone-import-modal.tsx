"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button, FormRow, Modal, fInput } from "@/components/ui";
import { importZones } from "@/app/d/pricing/action";
import type { GeoFeatureCollection, Tier } from "../types";
import { liveTiers, parseGeoJson, tierName } from "../zones";

/** GeoJSON file -> `POST /pricing/admin/zones/import` (all-or-nothing, ≤ 200 features). */
export function ZoneImportModal({ open, onClose, tiers }: { open: boolean; onClose: () => void; tiers: Tier[] }) {
  const t = useTranslations("pricing");
  return (
    <Modal open={open} onClose={onClose} title={t("zones.import.title")}>
      {open && <Body tiers={tiers} onClose={onClose} />}
    </Modal>
  );
}

function Body({ tiers, onClose }: { tiers: Tier[]; onClose: () => void }) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const router = useRouter();
  const choices = liveTiers(tiers);
  const file = useRef<HTMLInputElement>(null);
  const [collection, setCollection] = useState<GeoFeatureCollection | null>(null);
  const [fileName, setFileName] = useState("");
  const [tier, setTier] = useState(choices[choices.length - 1]?.code ?? "");
  const [nameProp, setNameProp] = useState("name");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const onFile = async (f: File | undefined) => {
    setMessage(null);
    setCollection(null);
    if (!f) return;
    setFileName(f.name);
    const parsed = parseGeoJson(await f.text());
    if (!parsed.ok) return setMessage(t(`zones.import.errors.${parsed.error}`));
    setCollection(parsed.collection);
  };

  const submit = () => {
    if (!collection || !tier) return;
    setMessage(null);
    start(async () => {
      const res = await importZones(collection, tier, nameProp.trim() || "name");
      if (!res.ok) return setMessage(res.error);
      router.refresh();
      onClose();
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-subtext">{t("zones.import.hint")}</p>
      <div>
        <input ref={file} type="file" accept=".geojson,.json,application/geo+json,application/json" onChange={(e) => onFile(e.target.files?.[0])} className="hidden" />
        <Button type="button" variant="secondary" size="sm" icon="download" onClick={() => file.current?.click()}>
          {t("zones.import.choose")}
        </Button>
        {fileName && <span className="ms-2 text-[12.5px] text-subtext">{fileName}</span>}
      </div>
      {collection && <p className="text-[13px] font-semibold text-text">{t("zones.import.found", { count: collection.features.length })}</p>}
      <div className="grid grid-cols-2 gap-3">
        <FormRow label={t("zones.import.tier")}>
          <select className={fInput} value={tier} onChange={(e) => setTier(e.target.value)}>
            {choices.map((x) => (
              <option key={x.code} value={x.code}>
                {tierName(tiers, x.code, locale)}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label={t("zones.import.name_property")}>
          <input className={fInput} dir="ltr" value={nameProp} onChange={(e) => setNameProp(e.target.value)} />
        </FormRow>
      </div>
      {message && <p className="text-sm text-danger">{message}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={pending}>
          {t("actions.cancel")}
        </Button>
        <Button type="button" size="sm" loading={pending} disabled={!collection || !tier} onClick={submit}>
          {t("zones.import.submit")}
        </Button>
      </div>
    </div>
  );
}
