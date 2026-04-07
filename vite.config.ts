import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

function normalizeBasePath(value: string | undefined): string {
  if (!value || value.trim() === "") return "/";
  let base = value.trim();
  if (!base.startsWith("/")) base = `/${base}`;
  if (!base.endsWith("/")) base = `${base}/`;
  return base;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = (env.VITE_SUPABASE_URL ?? "").trim();
  const hasValidSupabaseUrl = /^https?:\/\//i.test(supabaseUrl);
  const hasSupabaseAnonKey = Boolean((env.VITE_SUPABASE_ANON_KEY ?? "").trim());
  const hasReplicateToken = Boolean((env.REPLICATE_API_TOKEN ?? "").trim());

  // Terminal-side debug logs for `npm run dev` startup (safe: no secrets printed).
  console.log("[env-check] mode:", mode);
  console.log("[env-check] VITE_SUPABASE_URL:", supabaseUrl || "<missing>");
  console.log("[env-check] hasValidSupabaseUrl:", hasValidSupabaseUrl);
  console.log("[env-check] hasSupabaseAnonKey:", hasSupabaseAnonKey);
  console.log("[env-check] hasReplicateToken:", hasReplicateToken);

  if (!hasValidSupabaseUrl || !hasSupabaseAnonKey) {
    console.warn(
      "[env-check] Supabase frontend config is invalid. Replicate edit path will be skipped and Sana Sprint fallback will be used.",
    );
  }

  return {
    base: normalizeBasePath(env.VITE_BASE_PATH || process.env.VITE_BASE_PATH),
    envPrefix: ["VITE_", "APP_"],
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
