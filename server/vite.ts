import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
    // In production, the build output is structured differently
    // Check for both possible paths
    let distPath = path.resolve(import.meta.dirname, "public");

    // If running from dist/index.js, the public folder is at dist/public
    if (!fs.existsSync(distPath)) {
        distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
    }

    // If still not found, try relative to the current working directory
    if (!fs.existsSync(distPath)) {
        distPath = path.resolve(process.cwd(), "dist", "public");
    }

    if (!fs.existsSync(distPath)) {
        console.error(`Could not find the build directory. Tried:
        - ${ path.resolve(import.meta.dirname, "public") }
        - ${ path.resolve(import.meta.dirname, "..", "dist", "public") }
        - ${ path.resolve(process.cwd(), "dist", "public") }`);
        throw new Error(
            `Could not find the build directory: ${ distPath }, make sure to build the client first`,
        );
    }

    console.log(`Serving static files from: ${ distPath }`);
    app.use(express.static(distPath));
}

import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });

    console.log(`${ formattedTime } [${ source }] ${ message }`);
}

export async function setupVite(app: Express, server: Server) {
    const serverOptions = {
        middlewareMode: true,
        hmr: { server },
        allowedHosts: ["localhost", "127.0.0.1"],
    };

    const vite = await createViteServer({
        ...viteConfig,
        configFile: false,
        customLogger: {
            ...viteLogger,
            error: (msg, options) => {
                viteLogger.error(msg, options);
                process.exit(1);
            },
        },
        server: serverOptions,
        appType: "custom",
    });

    app.use(vite.middlewares);
    app.use("/*", async (req, res, next) => {
        const url = req.originalUrl;

        try {
            const clientTemplate = path.resolve(
                import.meta.dirname,
                "..",
                "client",
                "index.html",
            );

            // always reload the index.html file from disk incase it changes
            let template = await fs.promises.readFile(clientTemplate, "utf-8");
            template = template.replace(
                `src="/src/main.tsx"`,
                `src="/src/main.tsx?v=${ nanoid() }"`,
            );
            const page = await vite.transformIndexHtml(url, template);
            res.status(200).set({ "Content-Type": "text/html" }).end(page);
        } catch (e) {
            vite.ssrFixStacktrace(e as Error);
            next(e);
        }
    });
}

export function serveStaticProduction(app: Express) {
    const distPath = path.resolve(import.meta.dirname, "public");

    if (!fs.existsSync(distPath)) {
        throw new Error(
            `Could not find the build directory: ${ distPath }, make sure to build the client first`,
        );
    }

    app.use(express.static(distPath));

    // fall through to index.html if the file doesn't exist
    app.use("/*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
    });
}
