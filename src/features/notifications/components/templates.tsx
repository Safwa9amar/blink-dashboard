"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, Button, SearchBox, Modal, FormRow, DashIcon, fInput } from "@/components/ui";
import { NTYPE_KEYS, NTYPES, type Template, type TFn } from "../data";
import { useNotificationsStore } from "../store";
import { TypePill } from "./type-pill";

type TplForm = { name: string; type: string; message: string };

export function Templates({ t, onUse }: { t: TFn; onUse: (tpl: Template) => void }) {
  const templates = useNotificationsStore((s) => s.templates);
  const addTemplate = useNotificationsStore((s) => s.addTemplate);
  const updateTemplate = useNotificationsStore((s) => s.updateTemplate);
  const deleteTemplate = useNotificationsStore((s) => s.deleteTemplate);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TplForm>({
    defaultValues: { name: "", type: "promo", message: "" },
  });

  const openNew = () => {
    setEditing(null);
    reset({ name: "", type: "promo", message: "" });
    setOpen(true);
  };
  const openEdit = (tpl: Template) => {
    setEditing(tpl);
    reset({ name: tpl.name, type: tpl.type, message: tpl.message });
    setOpen(true);
  };
  const onSubmit = handleSubmit((d) => {
    if (editing) updateTemplate(editing.id, d);
    else addTemplate(d);
    setOpen(false);
  });

  const rows = templates.filter((tpl) => (q ? tpl.name.toLowerCase().includes(q.toLowerCase()) : true));

  return (
    <>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("tpl.search")} value={q} onChange={setQ} />
        <Button icon="plus" className="ms-auto" onClick={openNew}>
          {t("tpl.new")}
        </Button>
      </div>
      <Card>
        {rows.length === 0 ? (
          <div className="py-8 text-center text-subtext text-sm">{t("tpl.empty")}</div>
        ) : (
          rows.map((tpl, i) => (
            <div key={tpl.id} className={`flex gap-3.5 items-start py-3.5 ${i ? "border-t border-border" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="mb-1">
                  <TypePill type={tpl.type} />
                </div>
                <b className="block text-sm font-bold text-text">{tpl.name}</b>
                <p className="text-[12.5px] text-subtext mt-1">{tpl.message}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="secondary" size="sm" onClick={() => onUse(tpl)}>
                  {t("tpl.use")}
                </Button>
                <button
                  type="button"
                  onClick={() => openEdit(tpl)}
                  aria-label={t("edit")}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-text hover:bg-card-hover transition-colors cursor-pointer"
                >
                  <DashIcon name="pencil" className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => confirm(t("confirm_delete_template")) && deleteTemplate(tpl.id)}
                  aria-label={t("delete")}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
                >
                  <DashIcon name="trash" className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t("tpl.edit") : t("tpl.new")}>
        <form onSubmit={onSubmit}>
          <FormRow label={t("tpl.name")}>
            <input className={fInput} {...register("name", { required: t("required") })} placeholder={t("tpl.name_ph")} />
            {errors.name && <p className="text-danger text-xs mt-1.5">{errors.name.message}</p>}
          </FormRow>
          <FormRow label={t("col.type")}>
            <select className={fInput} {...register("type")}>
              {NTYPE_KEYS.map((k) => (
                <option key={k} value={k}>
                  {NTYPES[k].label}
                </option>
              ))}
            </select>
          </FormRow>
          <FormRow label={t("tpl.message")}>
            <textarea
              className={`${fInput} min-h-[90px] resize-y`}
              {...register("message", { required: t("required") })}
              placeholder={t("tpl.message_ph")}
            />
            {errors.message && <p className="text-danger text-xs mt-1.5">{errors.message.message}</p>}
          </FormRow>
          <div className="flex gap-2.5 justify-end mt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit">{t("save")}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
