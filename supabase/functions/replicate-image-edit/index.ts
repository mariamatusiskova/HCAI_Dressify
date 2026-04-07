// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const REPLICATE_API_BASE = "https://api.replicate.com/v1";
const MODEL_SLUG = "prunaai/p-image-edit";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  imageUrl?: string;
  prompt?: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
}

function toErrorResponse(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("REPLICATE_API_TOKEN");
    if (!token) {
      return toErrorResponse("Missing REPLICATE_API_TOKEN secret on Supabase", 500);
    }

    const body = (await req.json()) as RequestBody;
    const imageUrl = body.imageUrl?.trim();
    const prompt = body.prompt?.trim();
    const aspectRatio = body.aspectRatio ?? "1:1";

    if (!imageUrl) return toErrorResponse("imageUrl is required");
    if (!prompt) return toErrorResponse("prompt is required");

    const createPrediction = await fetch(`${REPLICATE_API_BASE}/models/${MODEL_SLUG}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        input: {
          images: [imageUrl],
          prompt,
          aspect_ratio: aspectRatio,
        },
      }),
    });

    if (!createPrediction.ok) {
      const errText = await createPrediction.text();
      return toErrorResponse(`Replicate create failed: ${errText}`, 502);
    }

    const created = await createPrediction.json();
    const getUrl = created?.urls?.get as string | undefined;
    if (!getUrl) return toErrorResponse("Replicate prediction URL missing", 502);

    let finalPrediction: any = created;
    const maxPolls = 60;
    for (let i = 0; i < maxPolls; i += 1) {
      const status = String(finalPrediction?.status ?? "");
      if (status === "succeeded" || status === "failed" || status === "canceled") break;
      await sleep(1200);
      const poll = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (!poll.ok) {
        const errText = await poll.text();
        return toErrorResponse(`Replicate poll failed: ${errText}`, 502);
      }
      finalPrediction = await poll.json();
    }

    if (String(finalPrediction?.status ?? "") !== "succeeded") {
      return toErrorResponse(`Replicate edit failed: ${finalPrediction?.error ?? "unknown error"}`, 502);
    }

    const output = finalPrediction?.output;
    const imageUrlOut =
      (typeof output === "string" ? output : undefined) ||
      (output?.url && typeof output.url === "function" ? output.url() : undefined) ||
      (output?.url && typeof output.url === "string" ? output.url : undefined) ||
      (Array.isArray(output) && typeof output[0] === "string" ? output[0] : undefined);

    if (!imageUrlOut) return toErrorResponse("No output image from Replicate", 502);

    return new Response(JSON.stringify({ imageUrl: imageUrlOut, status: "succeeded" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return toErrorResponse(error instanceof Error ? error.message : "Unexpected error", 500);
  }
});

