"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, fInput } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { createPromotionUploadUrl } from "@/app/d/promotions/action";

// Cover image: upload to the public `news` Storage bucket (same approach as News covers —
// signed upload URL, bytes go browser → Storage) or paste a URL.
export function CoverField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const t = useTranslations("promotions");
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setErr(null);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const { path, token, error } = await createPromotionUploadUrl(ext);
      if (error || !path || !token) throw new Error(error ?? "upload_failed");
      const supabase = createClient();
      const { error: upErr } = await supabase.storage.from("news").uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      onChange(supabase.storage.from("news").getPublicUrl(path).data.publicUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("errors.upload_failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-3 items-start">
      <div
        className="w-28 h-[72px] rounded-lg border border-border bg-muted bg-cover bg-center shrink-0"
        style={value ? { backgroundImage: `url(${value})` } : undefined}
      />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="secondary" size="sm" icon="image" loading={busy} onClick={() => fileRef.current?.click()}>
            {t("form.upload")}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              {t("form.remove")}
            </Button>
          )}
        </div>
        <input
          className={fInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("form.cover_url_ph")}
          dir="ltr"
        />
        {err && <p className="text-danger text-xs">{err}</p>}
      </div>
    </div>
  );
}
