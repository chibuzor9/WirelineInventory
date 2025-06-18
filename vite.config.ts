import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(({ mode }) => ({
    plugins: [
        react(),
        mode === 'development' && runtimeErrorOverlay(),
        themePlugin(),
    ].filter(Boolean),
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "client", "src"),
            "@shared": path.resolve(import.meta.dirname, "shared"),
            "@assets": path.resolve(import.meta.dirname, "attached_assets"),
        },
    },
    root: path.resolve(import.meta.dirname, "client"),
    envDir: path.resolve(import.meta.dirname),
    build: {
        outDir: path.resolve(import.meta.dirname, "public"),
        emptyOutDir: true,
        sourcemap: mode === 'development',
        minify: mode === 'production',
    },
    server: {
        proxy: {
            "/api": {
                target: "http://localhost:5000",
                changeOrigin: true,
                secure: false,
            }
        }
    },
    preview: {
        port: 4173,
        host: true,
    }
}));
