import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { supabase } from "./db";
import { config } from "./config";

declare global {
    namespace Express {
        interface User {
            id: string;
            email: string;
            [key: string]: any;
        }
    }
}

export function setupAuth(app: Express) {
    const isProduction = config.nodeEnv === 'production';

    const sessionSettings: session.SessionOptions = {
        secret: config.session.secret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            secure: isProduction, // Only send over HTTPS in production
            httpOnly: true, // Prevent XSS attacks
            sameSite: isProduction ? 'none' : 'lax', // CSRF protection, 'none' for cross-site requests in production
        },
        name: 'sessionId', // Custom session name
    };

    // Trust proxy in production (required for Vercel)
    if (isProduction) {
        app.set("trust proxy", 1);
    }

    app.use(session(sessionSettings));
}
