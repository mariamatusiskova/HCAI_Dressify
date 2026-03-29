import { supabase } from "@/lib/supabase";

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
    const message = error.message || "Replicate function call failed";
    if (message.toLowerCase().includes("non-2xx") || message.includes("401")) {
      throw new Error(
        "Replicate Edge Function returned 401. Disable JWT verification for the function or call it with an authenticated session.",
      );
    }
    throw new Error(message);
  }

  if (!data?.imageUrl) {
    throw new Error("Replicate returned no image");
  }

  return data.imageUrl;
}
