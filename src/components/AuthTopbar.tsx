import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { describeUnknownError } from "@/lib/error";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthTopbarProps = {
  className?: string;
};

const AuthTopbar = ({ className }: AuthTopbarProps) => {
  // the current logged-in user session, or null if nobody is logged in
  const [session, setSession] = useState<Session | null>(null);
  // whether logout is currently happening
  const [isSigningOut, setIsSigningOut] = useState(false);

  // check if supabase is available
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      return;
    }

    let mounted = true;

    const loadSession = async () => {
      // listens for auth changes
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
    // if no user return empty text
    if (!session?.user) {
      return "";
    }

    // if log in show an e-mail
    if (session.user.email) {
      return session.user.email;
    }

    return `${session.user.id.slice(0, 8)}...`;
  }, [session]);

  // sign out function
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

  // Supabase not configured
  if (!isSupabaseConfigured) {
    return (
      <div className={cn("text-xs text-muted-foreground", className)}>
        Auth unavailable
      </div>
    );
  }

  // No session -> show sign in/create account
  if (!session) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-10 rounded-full px-3 text-sm text-muted-foreground hover:bg-primary/16 hover:text-foreground hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0_0_1px_rgba(239,49,65,0.12),0_10px_24px_rgba(239,49,65,0.08)] dark:hover:bg-primary/20 dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_0_1px_rgba(255,255,255,0.05),0_10px_24px_rgba(239,49,65,0.1)]"
        >
          <Link to="/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" className="h-10 rounded-full px-5">
          <Link to="/register">Create account</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="hidden lg:block max-w-44 truncate text-xs text-muted-foreground">
        {userLabel}
      </span>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="h-10 rounded-full px-4"
        onClick={() => void handleSignOut()}
        disabled={isSigningOut}
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </Button>
    </div>
  );
};

export default AuthTopbar;
