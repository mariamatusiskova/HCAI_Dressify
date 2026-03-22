import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { describeUnknownError } from "@/lib/error";
import { GLOBAL_SYSTEM_PROMPT } from "@/types/styleTemplates";
import { getOrCreateSupabaseUserId } from "@/services/outfitsSupabase";
import {
  getUserDefaultSystemPrompt,
  upsertUserDefaultSystemPrompt,
} from "@/services/systemPromptsSupabase";

const STORAGE_KEY = "dressify-system-prompt";

function readLocalPrompt(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? GLOBAL_SYSTEM_PROMPT;
  } catch {
    return GLOBAL_SYSTEM_PROMPT;
  }
}

function writeLocalPrompt(prompt: string) {
  localStorage.setItem(STORAGE_KEY, prompt);
}

export function useSystemPrompt() {
  const [prompt, setPrompt] = useState<string>(readLocalPrompt);
  const [isSaving, setIsSaving] = useState(false);
  const [isCloudSyncEnabled, setIsCloudSyncEnabled] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let authUnsubscribe: (() => void) | null = null;

    const initialize = async () => {
      if (!isSupabaseConfigured) {
        if (mounted) {
          setIsCloudSyncEnabled(false);
          setUserId(null);
        }
        return;
      }

      try {
        const resolvedUserId = await getOrCreateSupabaseUserId();
        if (!mounted) return;

        if (!resolvedUserId) {
          setIsCloudSyncEnabled(false);
          setUserId(null);
          setSyncError("No Supabase auth session. System prompt is currently local-only.");
          return;
        }

        const remotePrompt = await getUserDefaultSystemPrompt(resolvedUserId);
        if (!mounted) return;

        setUserId(resolvedUserId);
        setIsCloudSyncEnabled(true);
        setSyncError(null);

        if (remotePrompt?.content?.trim()) {
          setPrompt(remotePrompt.content);
          writeLocalPrompt(remotePrompt.content);
        }
      } catch (error) {
        if (!mounted) return;
        setIsCloudSyncEnabled(false);
        setUserId(null);
        setSyncError(`System prompt sync failed: ${describeUnknownError(error, "Unknown Supabase error")}`);
      }
    };

    void initialize();

    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(() => {
        void initialize();
      });
      authUnsubscribe = () => data.subscription.unsubscribe();
    }

    return () => {
      mounted = false;
      authUnsubscribe?.();
    };
  }, []);

  const savePrompt = useCallback(
    async (nextPrompt: string) => {
      const trimmed = nextPrompt.trim();
      if (!trimmed) {
        throw new Error("System prompt cannot be empty.");
      }

      setIsSaving(true);
      try {
        if (isCloudSyncEnabled && userId) {
          const saved = await upsertUserDefaultSystemPrompt(userId, trimmed);
          setPrompt(saved.content);
          writeLocalPrompt(saved.content);
          setSyncError(null);
          return saved.content;
        }

        setPrompt(trimmed);
        writeLocalPrompt(trimmed);
        return trimmed;
      } finally {
        setIsSaving(false);
      }
    },
    [isCloudSyncEnabled, userId],
  );

  return {
    prompt,
    setPrompt,
    savePrompt,
    isSaving,
    isCloudSyncEnabled,
    syncError,
  };
}
