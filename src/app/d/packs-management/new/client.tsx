"use client";

import { PackEditor, type PackStoreOption } from "@/features/packs-management";

export default function NewPackClient({ stores, error }: { stores: PackStoreOption[]; error?: string }) {
  return <PackEditor mode="create" stores={stores} storesError={error} />;
}
