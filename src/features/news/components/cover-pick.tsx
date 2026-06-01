"use client";

import { useRef, useState } from "react";
import { DashIcon } from "@/components/ui";

// Cover picker: choose a preset cover or upload a custom one. When `onUpload` is
// provided the file is uploaded (to Supabase Storage) and the returned URL is
// used; otherwise it falls back to a data-URL.
export function CoverPick({
  covers,
  value,
  onChange,
  uploadLabel,
  onUpload,
}: {
  covers: string[];
  value: string;
  onChange: (url: string) => void;
  uploadLabel: string;
  onUpload?: (file: File) => Promise<string>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  // A custom (uploaded) cover is any value not in the preset list.
  const [custom, setCustom] = useState(() => (covers.includes(value) ? "" : value));
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (onUpload) {
      setBusy(true);
      try {
        const url = await onUpload(file);
        setCustom(url);
        onChange(url);
      } catch (err) {
        console.error("cover upload failed:", err);
      } finally {
        setBusy(false);
      }
      return;
    }

    // Fallback: data-URL (no uploader wired).
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setCustom(src);
      onChange(src);
    };
    reader.readAsDataURL(file);
  }

  const tiles = custom ? [...covers, custom] : covers;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {tiles.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-16 h-[42px] rounded-[9px] bg-cover bg-center cursor-pointer border-2 ${
            value === c ? "border-primary" : "border-transparent"
          }`}
          style={{ backgroundImage: `url(${c})` }}
        />
      ))}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="w-16 h-[42px] rounded-[9px] border-2 border-dashed border-border text-subtext flex flex-col items-center justify-center gap-0.5 hover:border-primary hover:text-primary transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        title={uploadLabel}
        aria-label={uploadLabel}
      >
        {busy ? (
          <span className="w-4 h-4 rounded-full border-2 border-border border-t-primary animate-spin" />
        ) : (
          <>
            <DashIcon name="image" className="w-4 h-4" />
            <span className="text-[8px] font-bold uppercase tracking-wide">{uploadLabel}</span>
          </>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
    </div>
  );
}
