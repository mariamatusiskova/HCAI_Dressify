import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LogOut, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const AuthPanel = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      return;
    }

    let mounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        toast.error(`Auth check failed: ${error.message}`);
        return;
      }

      setSession(data.session);
    };

    void loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const userLabel = useMemo(() => {
    if (!session?.user) {
      return "No active session";
    }

    if (session.user.email) {
      return session.user.email;
    }

    return `${session.user.id.slice(0, 8)}...`;
  }, [session]);

  const handleMagicLink = useCallback(async () => {
    if (!supabase) {
      toast.error("Supabase is not configured.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Enter an email address first.");
      return;
    }

    setIsSendingMagicLink(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        throw error;
      }

      toast.success("Magic link sent. Check your inbox.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Magic link sign-in failed: ${message}`);
    } finally {
      setIsSendingMagicLink(false);
    }
  }, [email]);

  const handleSignOut = useCallback(async () => {
    if (!supabase) {
      return;
    }

    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      toast.success("Signed out.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Sign out failed: ${message}`);
    } finally {
      setIsSigningOut(false);
    }
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-md border border-border bg-card/40 p-3">
        <div className="text-xs text-muted-foreground">
          Supabase is not configured. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-border bg-card/40 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Auth</span>
        <span className="text-[10px] text-muted-foreground">{session ? "Signed in" : "Not signed in"}</span>
      </div>

      <div className="text-xs text-muted-foreground truncate">{userLabel}</div>

      {session ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 w-full text-xs"
          onClick={() => void handleSignOut()}
          disabled={isSigningOut}
        >
          <LogOut className="h-3 w-3 mr-1" />
          Sign Out
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs"
              onClick={() => void handleMagicLink()}
              disabled={isSendingMagicLink}
            >
              <Mail className="h-3 w-3 mr-1" />
              Link
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPanel;
