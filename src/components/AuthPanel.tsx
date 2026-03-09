import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { describeUnknownError } from "@/lib/error";

const AuthPanel = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
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

  const handleSignIn = useCallback(async () => {
    if (!supabase) {
      toast.error("Supabase is not configured.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      toast.error("Enter email and password.");
      return;
    }

    setIsSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (error) {
        throw error;
      }

      toast.success("Signed in.");
    } catch (error) {
      const message = describeUnknownError(error, "Unknown auth error");
      toast.error(`Sign-in failed: ${message}`);
    } finally {
      setIsSigningIn(false);
    }
  }, [email, password]);

  const handleSignUp = useCallback(async () => {
    if (!supabase) {
      toast.error("Supabase is not configured.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      toast.error("Enter email and password.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsSigningUp(true);
    try {
      const redirectTo = new URL(import.meta.env.BASE_URL, window.location.origin).toString();
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });
      if (error) {
        throw error;
      }

      if (data.session) {
        toast.success("Account created and signed in.");
      } else {
        toast.success("Account created. Confirm your email, then sign in.");
      }
    } catch (error) {
      const message = describeUnknownError(error, "Unknown auth error");
      toast.error(`Sign-up failed: ${message}`);
    } finally {
      setIsSigningUp(false);
    }
  }, [email, password]);

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
      const message = describeUnknownError(error, "Unknown auth error");
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
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-8 text-xs"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-8 text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs"
              onClick={() => void handleSignIn()}
              disabled={isSigningIn || isSigningUp}
            >
              <LogIn className="h-3 w-3 mr-1" />
              Sign In
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 text-xs"
              onClick={() => void handleSignUp()}
              disabled={isSigningIn || isSigningUp}
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Create
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPanel;
