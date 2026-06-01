import { createAdminClient } from "@/lib/supabase/admin";
import { rowToPost, type NewsRow } from "@/features/news";
import Client from "./client";

export default async function NewsDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;

  const supabase = await createAdminClient();
  const { data } = await supabase.from("news").select("*").eq("id", id).maybeSingle();
  const post = data ? rowToPost(data as NewsRow) : null;

  return <Client id={id} initialPost={post} startInEdit={edit === "1"} />;
}
