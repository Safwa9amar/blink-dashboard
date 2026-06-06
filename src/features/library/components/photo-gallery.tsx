"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { Button, DashIcon, fInput } from "@/components/ui";
import type { TFn } from "../data";

// Product photo gallery: a grid of tiles (photos[0] is the cover) with hover
// actions (set-as-cover, remove), a dashed "add" tile that opens a multi-file
// picker, and a URL-paste row. Fully controlled via `photos` / `onChange`.
// Photos upload straight to Supabase Storage through `onUpload` (signed URL).
export function PhotoGallery({
  t,
  photos,
  max,
  onChange,
  onUpload,
}: {
  t: TFn;
  photos: string[];
  max: number;
  onChange: (next: string[]) => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  const room = max - photos.length;
  const canAdd = room > 0;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, room);
    e.target.value = "";
    if (!files.length) return;
    setErr(null);
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const f of files) uploaded.push(await onUpload(f));
      onChange([...photos, ...uploaded]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const removeAt = (i: number) => onChange(photos.filter((_, idx) => idx !== i));
  const makeCover = (i: number) => onChange([photos[i], ...photos.filter((_, idx) => idx !== i)]);
  const addUrl = () => {
    const u = url.trim();
    if (u && canAdd) {
      onChange([...photos, u]);
      setUrl("");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {photos.map((src, i) => (
          <div
            key={`${i}-${src}`}
            className="group relative w-[88px] h-[88px] rounded-xl overflow-hidden border border-border bg-muted shrink-0"
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute top-1 start-1 bg-primary text-white text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full">
                {t("form.cover")}
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity">
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => makeCover(i)}
                  aria-label={t("form.make_cover")}
                  title={t("form.make_cover")}
                  className="w-7 h-7 rounded-lg bg-white/90 text-text inline-flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                >
                  <DashIcon name="star" className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={t("form.remove")}
                title={t("form.remove")}
                className="w-7 h-7 rounded-lg bg-white/90 text-danger inline-flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
              >
                <DashIcon name="trash" className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="w-[88px] h-[88px] rounded-xl border-2 border-dashed border-border text-subtext inline-flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer hover:border-primary hover:text-primary hover:bg-soft-pink/40 disabled:opacity-60 disabled:cursor-wait shrink-0"
          >
            {busy ? (
              <span className="w-5 h-5 rounded-full border-2 border-border border-t-primary animate-spin" />
            ) : (
              <>
                <DashIcon name="image" className="w-5 h-5" />
                <span className="text-[11px] font-semibold">{t("form.add_photo")}</span>
              </>
            )}
          </button>
        )}
      </div>

      {photos.length === 0 && !busy && (
        <p className="text-[12px] text-subtext mt-2.5">{t("form.no_photos", { max })}</p>
      )}

      {canAdd && (
        <div className="flex gap-2 mt-3">
          <input
            className={fInput}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder={t("form.paste_url")}
          />
          <Button type="button" variant="secondary" size="sm" onClick={addUrl} disabled={!url.trim()} className="shrink-0">
            {t("form.add")}
          </Button>
        </div>
      )}

      {err && <p className="text-danger text-xs mt-2">{err}</p>}
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
    </div>
  );
}
