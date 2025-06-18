import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import session from 'express-session';
import { apiStorage } from './storage.js';
import { z } from 'zod';

// Extend session type
declare module 'express-session' {
    interface SessionData {
        userId?: number;
    }
}

// Create Express app for handling requests
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration for Vercel
const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'halliburton-inventory-fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: true, // HTTPS only in production
        httpOnly: true, // Prevent XSS attacks
        sameSite: 'none', // CSRF protection for cross-site requests
    },
    name: 'sessionId',
};

app.use(session(sessionSettings));

// CORS middleware
app.use((req, res, next) => {
    const allowedOrigins = [
        process.env.VERCEL_URL ? `https://${ process.env.VERCEL_URL }` : '',
        process.env.PRODUCTION_URL || '',
        'https://wireline-inventory.vercel.app',
    ].filter(Boolean);

    const origin = req.headers.origin;

    if (!origin || allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }

    next();
});

// Helper functions
function isAuthenticated(req: express.Request): boolean {
    return !!req.session?.userId;
}

async function getUserFromSession(req: express.Request) {
    const userId = req.session?.userId;
    if (!userId) return null;
    const user = await apiStorage.getUser(userId);
    return user || null;
}

// User validation schema
const insertUserSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
    full_name: z.string().min(1),
    email: z.string().email(),
    role: z.string().default('user')
});

type InsertUser = z.infer<typeof insertUserSchema>;

// Routes
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        console.log('[API] Login attempt');
        const { username, password } = req.body;

        if (!username || !password) {
            console.log('[API] Missing username or password');
            return res.status(400).json({ message: 'Username and password are required' });
        } console.log(`[API] Getting user: ${ username }`);
        const user = await apiStorage.getUserByUsername(username);

        if (!user) {
            console.log(`[API] User not found: ${ username }`);
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Password comparison based on user role
        let isPasswordValid = false;
        if (user.role === 'admin') {
            isPasswordValid = user.password === password;
        } else {
            isPasswordValid = await apiStorage.comparePassword(password, user.password);
        }

        if (!isPasswordValid) {
            console.log(`[API] Invalid password for: ${ username }`);
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        req.session.userId = Number(user.id);
        console.log(`[API] Login successful: ${ username }`);
        res.json(user);
    } catch (error) {
        console.error('[API] Login error:', error);
        res.status(500).json({ message: 'Internal server error during login' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.status(200).json({ message: 'Logged out' });
    });
});

// Get current user
app.get('/api/me', async (req, res) => {
    try {
        if (!isAuthenticated(req)) return res.sendStatus(401);

        const user = await getUserFromSession(req);
        if (!user) return res.sendStatus(401);

        res.json(user);
    } catch (error) {
        console.error('[API] Get user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Register a new user
app.post('/api/register', async (req, res) => {
    try {
        console.log('[API] Registration attempt');
        const { username, password, full_name, email } = req.body;

        if (!username || !password || !full_name || !email) {
            console.log('[API] Missing required fields');
            return res.status(400).json({ message: 'All fields are required' });
        } console.log('[API] Checking if user exists');
        const existing = await apiStorage.getUserByUsername(username);
        if (existing) {
            console.log('[API] User already exists');
            return res.status(409).json({ message: 'Username already exists' });
        }

        console.log('[API] Validating user data');
        const validatedData = insertUserSchema.parse({
            username,
            password,
            full_name,
            email,
            role: 'user'
        });

        const userData: InsertUser = {
            username: validatedData.username,
            password: validatedData.password,
            full_name: validatedData.full_name,
            email: validatedData.email,
            role: validatedData.role,
        };

        console.log('[API] Creating user');
        const user = await apiStorage.createUser(userData);

        req.session.userId = Number(user.id);
        console.log('[API] Registration successful');
        res.status(201).json(user);
    } catch (error) {
        console.error('[API] Registration error:', error);
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Internal server error during registration' });
        }
    }
});

// Export handler for Vercel
export default function handler(req: VercelRequest, res: VercelResponse) {
    return app(req as any, res as any);
}
