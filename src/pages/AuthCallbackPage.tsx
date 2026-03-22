import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { describeUnknownError } from "@/lib/error";
import { supabase } from "@/lib/supabase";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Finalizing sign-in...");

  useEffect(() => {
    let mounted = true;

    const finalizeAuth = async () => {
      if (!supabase) {
        if (!mounted) return;
        setStatus("Supabase is not configured.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session) {
          if (!mounted) return;
          setStatus("Signed in. Redirecting...");
          navigate("/", { replace: true });
        } else {
          if (!mounted) return;
          setStatus("No active session found.");
          navigate("/login", { replace: true });
        }
      } catch (error) {
        if (!mounted) return;
        const message = describeUnknownError(error, "Unknown auth callback error");
        toast.error(`Auth callback failed: ${message}`);
        setStatus("Sign-in callback failed.");
        navigate("/login", { replace: true });
      }
    };

    void finalizeAuth();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return <div className="min-h-screen bg-background p-6 flex items-center justify-center text-sm">{status}</div>;
};

export default AuthCallbackPage;
