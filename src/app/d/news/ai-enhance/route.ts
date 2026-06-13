import { hasStaffRole } from "@/lib/auth/staff";
import { chatStream, AIError } from "@/lib/ai";
import { newsEnhanceMessages, type NewsField } from "@/features/news/ai";
import type { Lang } from "@/components/ui";

// Streaming single-field enhancer for the news composer's inline "enhance"
// buttons. Rewrites the given title/summary/body in place, in the same language,
// streaming the improved copy back as newline-delimited JSON (same envelope as
// ai-draft). No JSON schema — see the note in ai-draft/route.ts.

export const dynamic = "force-dynamic";

interface EnhanceBody {
  text?: string;
  field?: NewsField;
  lang?: Lang;
  category?: string;
  audience?: string[];
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  ttl?: number;
}

export async function POST(req: Request) {
  if (!(await hasStaffRole("super_admin", "ops_admin"))) {
    return new Response("Forbidden", { status: 403 });
  }
  let body: EnhanceBody;
  try {
    body = (await req.json()) as EnhanceBody;
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  if (!body.text?.trim()) {
    return Response.json({ error: "Nothing to enhance — write some text first." }, { status: 400 });
  }

  const field: NewsField =
    body.field === "summary" || body.field === "body" ? body.field : "title";
  const messages = newsEnhanceMessages({
    text: body.text,
    field,
    lang: body.lang === "fr" || body.lang === "ar" ? body.lang : "en",
    category: body.category,
    audience: body.audience,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        for await (const delta of chatStream({
          messages,
          baseUrl: body.baseUrl,
          model: body.model || undefined,
          temperature: body.temperature ?? 0.7,
          maxTokens: body.maxTokens,
          ttl: body.ttl,
          signal: req.signal,
        })) {
          if (delta.reasoning) send({ type: "reasoning", text: delta.reasoning });
          if (delta.content) send({ type: "content", text: delta.content });
        }
        send({ type: "done" });
      } catch (e) {
        send({ type: "error", message: e instanceof AIError ? e.message : "Enhancement failed." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
