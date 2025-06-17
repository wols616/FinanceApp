import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  base: "/",
  build: {
    target: "esnext", // o puedes usar una versión específica: 'es2022'
    outDir: "dist",
  },
});
