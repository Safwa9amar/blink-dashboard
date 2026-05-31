"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Modal, DashIcon, fInput } from "@/components/ui";
import { useDeepLinksStore } from "../store";
import type { ImportResult } from "../types";

export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("deep_links");
  const importFromText = useDeepLinksStore((s) => s.importFromText);

  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setText("");
    setFileName(null);
    setResult(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const content = await file.text();
    setText(content);
    setFileName(file.name);
    setResult(null);
  };

  const apply = () => {
    const res = importFromText(text, fileName ?? undefined);
    setResult(res);
    if (res.ok) setTimeout(close, 900);
  };

  const errorText = (code?: string) =>
    code === "invalid_json" ? t("err_invalid_json") : code === "no_routes" ? t("err_no_routes") : t("err_generic");

  return (
    <Modal open={open} onClose={close} title={t("import_title")}>
      <p className="text-[13px] text-subtext mb-4">{t("import_desc")}</p>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-xl py-7 px-4 text-subtext hover:border-primary hover:text-primary transition-colors cursor-pointer mb-3"
      >
        <DashIcon name="download" className="w-6 h-6 rotate-180" />
        <span className="text-sm font-semibold">{fileName ?? t("choose_file")}</span>
        <span className="text-[11px]">{t("choose_file_hint")}</span>
      </button>

      <div className="text-[11px] font-bold text-subtext uppercase tracking-wider mb-1.5">{t("or_paste")}</div>
      <textarea
        className={`${fInput} min-h-[120px] resize-y font-mono text-[12px]`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setResult(null);
        }}
        placeholder='{ "scheme": "blink", "routes": [ … ] }'
      />

      {result && (
        <p className={`text-xs mt-2 ${result.ok ? "text-success" : "text-danger"}`}>
          {result.ok ? t("import_ok", { count: result.count }) : errorText(result.error)}
        </p>
      )}

      <div className="flex gap-2.5 justify-end mt-4">
        <Button type="button" variant="secondary" onClick={close}>
          {t("cancel")}
        </Button>
        <Button type="button" icon="download" onClick={apply} disabled={!text.trim()} className="[&_svg]:rotate-180">
          {t("import_apply")}
        </Button>
      </div>
    </Modal>
  );
}
