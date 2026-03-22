import { supabase } from "@/lib/supabase";

export interface SystemPromptRecord {
  id: string;
  user_id: string;
  name: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }
  return supabase;
}

export async function getUserDefaultSystemPrompt(userId: string): Promise<SystemPromptRecord | null> {
  const client = requireSupabase();

  const result = await client
    .from("system_prompts")
    .select("id, user_id, name, content, is_default, created_at, updated_at")
    .eq("user_id", userId)
    .eq("is_default", true)
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return (result.data as SystemPromptRecord | null) ?? null;
}

export async function upsertUserDefaultSystemPrompt(
  userId: string,
  content: string,
): Promise<SystemPromptRecord> {
  const client = requireSupabase();
  const now = new Date().toISOString();
  const trimmedContent = content.trim();

  const existing = await getUserDefaultSystemPrompt(userId);
  if (existing) {
    const updated = await client
      .from("system_prompts")
      .update({
        content: trimmedContent,
        updated_at: now,
      })
      .eq("id", existing.id)
      .eq("user_id", userId)
      .select("id, user_id, name, content, is_default, created_at, updated_at")
      .single();

    if (updated.error || !updated.data) {
      throw updated.error ?? new Error("Failed to update system prompt");
    }

    return updated.data as SystemPromptRecord;
  }

  const inserted = await client
    .from("system_prompts")
    .insert({
      user_id: userId,
      name: "default",
      content: trimmedContent,
      is_default: true,
      created_at: now,
      updated_at: now,
    })
    .select("id, user_id, name, content, is_default, created_at, updated_at")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Failed to create system prompt");
  }

  return inserted.data as SystemPromptRecord;
}
