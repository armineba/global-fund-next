import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      "/socket.io": { target: "http://127.0.0.1:3101", ws: true },
      "/health": "http://127.0.0.1:3101",
    },
  },
  build: { chunkSizeWarningLimit: 1500 },
});
