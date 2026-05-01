import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

async function readEdgeFunctionErrorBody(response: Response): Promise<string> {
  try {
    const cloned = response.clone();
    const text = await cloned.text();
    if (!text) return "";
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (typeof parsed?.error === "string" && parsed.error) return parsed.error;
    } catch {
      /* not JSON */
    }
    return text.slice(0, 500);
  } catch {
    return "";
  }
}

interface EditWithReplicateInput {
  imageUrl: string;
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
}

interface EditWithReplicateResponse {
  imageUrl: string;
  status: string;
}

export async function editImageWithReplicate(input: EditWithReplicateInput): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const { data, error } = await supabase.functions.invoke<EditWithReplicateResponse>("replicate-image-edit", {
    body: {
      imageUrl: input.imageUrl,
      prompt: input.prompt,
      aspectRatio: input.aspectRatio ?? "1:1",
    },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const response = error.context as Response;
      const status = response.status;
      const detail = await readEdgeFunctionErrorBody(response);
      if (status === 401) {
        throw new Error(
          "Edge function rejected the request (401). Sign out and sign in again if your session expired, or in Supabase Dashboard → Edge Functions → replicate-image-edit ensure JWT verification matches how you call the function.",
        );
      }
      const suffix = detail ? `: ${detail}` : "";
      throw new Error(`Replicate edge function failed (${status})${suffix}`);
    }
    throw new Error(error instanceof Error ? error.message : "Replicate function call failed");
  }

  if (!data?.imageUrl) {
    throw new Error("Replicate returned no image");
  }

  return data.imageUrl;
}
