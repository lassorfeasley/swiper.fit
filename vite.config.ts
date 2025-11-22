import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    include: ["vaul"],
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "supabase-vendor": ["@supabase/supabase-js", "@supabase/auth-ui-react", "@supabase/auth-ui-shared"],
          "ui-vendor": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-dialog",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-switch",
            "@radix-ui/react-tooltip",
            "framer-motion",
            "lucide-react"
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      components: fileURLToPath(new URL("./src/components", import.meta.url)),
      common: fileURLToPath(
        new URL("./src/components/common", import.meta.url)
      ),
      pages: fileURLToPath(new URL("./src/pages", import.meta.url)),
    },
  },
});
