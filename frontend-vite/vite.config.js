import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://deen-guide-backend.onrender.com",
        changeOrigin: true,
        secure: true,
      },
      "/admin": {
        target: "https://deen-guide-backend.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});cd