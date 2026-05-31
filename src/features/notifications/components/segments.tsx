"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, Button, SearchBox, Modal, FormRow, DashIcon, fInput } from "@/components/ui";
import { type TFn } from "../data";
import { useNotificationsStore } from "../store";

type SegForm = { name: string; description: string; count: number };

export function Segments({ t }: { t: TFn }) {
  const segments = useNotificationsStore((s) => s.segments);
  const addSegment = useNotificationsStore((s) => s.addSegment);
  const deleteSegment = useNotificationsStore((s) => s.deleteSegment);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SegForm>({
    defaultValues: { name: "", description: "", count: 1000 },
  });

  const openNew = () => {
    reset({ name: "", description: "", count: 1000 });
    setOpen(true);
  };
  const onSubmit = handleSubmit((d) => {
    addSegment({ name: d.name, description: d.description, count: Number(d.count) || 0 });
    setOpen(false);
  });

  const rows = segments.filter((s) => (q ? s.name.toLowerCase().includes(q.toLowerCase()) : true));

  return (
    <>
      <div className="flex items-center gap-3 mb-[18px]">
        <SearchBox placeholder={t("seg.search")} value={q} onChange={setQ} />
        <Button icon="plus" className="ms-auto" onClick={openNew}>
          {t("seg.new")}
        </Button>
      </div>
      <Card>
        {rows.length === 0 ? (
          <div className="py-8 text-center text-subtext text-sm">{t("seg.empty")}</div>
        ) : (
          rows.map((s, i) => (
            <div key={s.id} className={`flex items-center gap-4 py-3.5 ${i ? "border-t border-border" : ""}`}>
              <div className="w-[38px] h-[38px] rounded-[11px] bg-soft-pink flex items-center justify-center shrink-0">
                <DashIcon name="users" className="w-[18px] h-[18px] text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14.5px] font-bold text-text">{s.name}</div>
                <div className="text-xs text-subtext mt-0.5">{s.description}</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-sm text-text">{s.count.toLocaleString()}</div>
                <div className="text-[10px] text-subtext uppercase tracking-wide">{t("seg.users")}</div>
              </div>
              <button
                type="button"
                onClick={() => confirm(t("confirm_delete_segment")) && deleteSegment(s.id)}
                aria-label={t("delete")}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-subtext hover:text-danger hover:bg-danger-light transition-colors cursor-pointer shrink-0"
              >
                <DashIcon name="trash" className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t("seg.new")}>
        <form onSubmit={onSubmit}>
          <FormRow label={t("seg.name")}>
            <input className={fInput} {...register("name", { required: t("required") })} placeholder={t("seg.name_ph")} />
            {errors.name && <p className="text-danger text-xs mt-1.5">{errors.name.message}</p>}
          </FormRow>
          <FormRow label={t("seg.description")}>
            <input className={fInput} {...register("description")} placeholder={t("seg.desc_ph")} />
          </FormRow>
          <FormRow label={t("seg.count")}>
            <input
              type="number"
              className={fInput}
              {...register("count", { required: t("required"), min: { value: 0, message: t("required") }, valueAsNumber: true })}
            />
            {errors.count && <p className="text-danger text-xs mt-1.5">{errors.count.message}</p>}
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
