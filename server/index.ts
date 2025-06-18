import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { config, validateConfig } from "@shared/config";
import 'dotenv/config'

// Validate environment configuration on startup
try {
    validateConfig();
} catch (error) {
    console.error('❌ Configuration Error:', error);
    process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add environment-aware CORS configuration
app.use((req, res, next) => {
    const allowedOrigins = config.isProd
        ? [process.env.VERCEL_URL ? `https://${ process.env.VERCEL_URL }` : 'https://your-domain.vercel.app']
        : ['http://localhost:5000', 'http://localhost:5173'];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin as string)) {
        res.setHeader('Access-Control-Allow-Origin', origin as string);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }

    next();
});

app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${ req.method } ${ path } ${ res.statusCode } in ${ duration }ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${ JSON.stringify(capturedJsonResponse) }`;
            }

            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }

            log(logLine);
        }
    });

    next();
});

(async () => {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";

        res.status(status).json({ message });
        throw err;
    });
    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
        await setupVite(app, server);
    } else {
        serveStatic(app);
    }
    // Dynamic port configuration for different environments
    const port = config.port;
    const host = config.host;

    server.listen({
        port,
        host,
        reusePort: !config.isProd,
    }, () => {
        log(`🚀 Server running on ${ host }:${ port } in ${ process.env.NODE_ENV || 'development' } mode`);
        log(`🌐 Health check available at: http://${ host }:${ port }/health`);
    });
})();
