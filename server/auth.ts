import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { supabase } from "./db";

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
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "halliburton-inventory-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
    app.use(session(sessionSettings));
  }
