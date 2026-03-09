import { defineConfig } from "vite";
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
export default defineConfig(({ mode }) => ({
  base: normalizeBasePath(process.env.VITE_BASE_PATH),
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
}));
