import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { describeUnknownError } from "@/lib/error";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      if (!supabase || !isSupabaseConfigured) {
        if (mounted) setIsCheckingSession(false);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        toast.error(`Auth check failed: ${error.message}`);
        setIsCheckingSession(false);
        return;
      }

      if (data.session) {
        navigate("/", { replace: true });
        return;
      }

      setIsCheckingSession(false);
    };

    void checkSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

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
      if (error) throw error;

      toast.success("Signed in.");
      navigate("/", { replace: true });
    } catch (error) {
      const message = describeUnknownError(error, "Unknown auth error");
      toast.error(`Sign-in failed: ${message}`);
    } finally {
      setIsSigningIn(false);
    }
  }, [email, navigate, password]);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 space-y-4">
          <h1 className="text-xl font-semibold">Login</h1>
          <p className="text-sm text-muted-foreground">
            Supabase is not configured. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
          </p>
        </div>
      </div>
    );
  }

  if (isCheckingSession) {
    return <div className="min-h-screen bg-background p-6 flex items-center justify-center text-sm">Checking session...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 space-y-4">
        <h1 className="text-xl font-semibold">Login</h1>
        <p className="text-sm text-muted-foreground">Sign in to sync your wardrobe, history, and outfits.</p>

        <div className="space-y-3">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button className="w-full" onClick={() => void handleSignIn()} disabled={isSigningIn}>
            {isSigningIn ? "Signing in..." : "Sign In"}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          No account?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
