"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { createPackImageUploadUrl } from "@/app/d/packs-management/action";
import { PACK_IMAGE_BUCKET, PACK_IMAGE_MAX_BYTES, PACK_IMAGE_TYPES } from "../types";
import { PackThumb } from "./pack-thumb";

/**
 * The pack photo (optional — the app falls back to a collage of the products'
 * photos). Uploads go to the public `merchant` bucket, where the merchant app's
 * pack photos live, under `packs/{storeId}/`: a server action mints a one-time
 * signed upload URL and the browser sends the file straight to Storage.
 */
export function PackImageField({
  value,
  onChange,
  storeId,
  error,
  onUploadingChange,
}: {
  value: string;
  onChange: (url: string) => void;
  /** Uploads need the store (the photo is filed under it). */
  storeId: string | null;
  error?: string;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const t = useTranslations("packs.editor");
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const setUploading = (on: boolean) => {
    setBusy(on);
    onUploadingChange(on);
  };

  async function upload(file: File) {
    setUploadError(null);
    if (!storeId) return;
    if (!PACK_IMAGE_TYPES[file.type]) return setUploadError(t("errors.image_type"));
    if (file.size > PACK_IMAGE_MAX_BYTES) return setUploadError(t("errors.image_size"));

    setUploading(true);
    try {
      const { path, token, error: urlError } = await createPackImageUploadUrl(storeId, file.type);
      if (urlError || !path || !token) throw new Error(urlError ?? t("errors.upload_failed", { detail: "" }));
      const supabase = createClient();
      const { error: upError } = await supabase.storage
        .from(PACK_IMAGE_BUCKET)
        .uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (upError) throw new Error(t("errors.upload_failed", { detail: upError.message }));
      onChange(supabase.storage.from(PACK_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : t("errors.upload_failed", { detail: "" }));
    } finally {
      setUploading(false);
    }
  }

  const shownError = uploadError ?? error;

  return (
    <div className="flex items-start gap-4">
      <PackThumb src={value || null} className="w-24 h-24" />
      <div className="min-w-0 flex-1 space-y-2">
        <input
          ref={fileRef}
          type="file"
          accept={Object.keys(PACK_IMAGE_TYPES).join(",")}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon="image"
            loading={busy}
            disabled={!storeId}
            onClick={() => fileRef.current?.click()}
          >
            {value ? t("details.replace") : t("details.upload")}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => onChange("")}>
              {t("details.remove")}
            </Button>
          )}
        </div>
        <p className="text-xs text-subtext">{storeId ? t("details.image_rules") : t("details.image_pick_store")}</p>
        <p className="text-xs text-subtext">{t("details.image_hint")}</p>
        {shownError && (
          <p role="alert" className="text-xs text-danger">
            {shownError}
          </p>
        )}
      </div>
    </div>
  );
}
