import { hasStaffRole } from "@/lib/auth/staff";
import { chatStream, AIError } from "@/lib/ai";
import { newsDraftMessages } from "@/features/news/ai";

// Streaming news-draft generator. Unlike the `generateNewsDraft` server action
// (one-shot, JSON-schema constrained), this route streams the model's tokens to
// the browser as newline-delimited JSON so the operator sees generation live —
// including a reasoning model's thinking. It deliberately omits the JSON schema:
// LM Studio applies schema grammar to the *reasoning* stream and traps the output
// (bug #1773), so we prompt for JSON and the client parses the streamed content.

export const dynamic = "force-dynamic";

interface DraftRequestBody {
  topic?: string;
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
  let body: DraftRequestBody;
  try {
    body = (await req.json()) as DraftRequestBody;
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  if (!body.topic?.trim()) {
    return Response.json({ error: "Describe what the post should be about." }, { status: 400 });
  }

  const messages = newsDraftMessages({
    topic: body.topic,
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
          // Client abort (Stop) propagates here → cancels the upstream LM request.
          signal: req.signal,
          // No schema — see the note above (reasoning-model safe).
        })) {
          if (delta.reasoning) send({ type: "reasoning", text: delta.reasoning });
          if (delta.content) send({ type: "content", text: delta.content });
        }
        send({ type: "done" });
      } catch (e) {
        send({ type: "error", message: e instanceof AIError ? e.message : "Generation failed." });
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
