import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const path = require("path");

export default defineConfig({
  root: "src/",
  base: "./",
  build: {
    outDir: path.resolve(__dirname, "./../app/dist/renderer"),
  },
  publicDir: path.resolve(__dirname, "./public"),
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "./src"),
    },
  },
  envPrefix: ["REACT_APP_"],
  plugins: [react()],
  server: {
    port: parseInt(process.env.REACT_APP_STATIC_SERVER_PORT || "5173"),
    strictPort: true,
  },
});
