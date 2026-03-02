import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  server: {
    host: "0.0.0.0"
  },
  preview: {
    host: "0.0.0.0"
  },
  build: {
    outDir: "../../dist",
    emptyOutDir: true
  }
});
