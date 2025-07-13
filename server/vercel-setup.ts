import type { Express } from 'express';
import { setupAuth } from './auth';
import { userCleanupService } from './cleanup';
import { registerRoutes as registerMainRoutes } from './routes';

export async function setupVercelApp(app: Express): Promise<void> {
    // Setup authentication middleware
    setupAuth(app);
    
    // Register all routes without creating HTTP server
    await registerMainRoutes(app);
    
    // Start cleanup service in serverless environment
    // Note: In production Vercel, use Vercel Cron Jobs instead
    if (process.env.NODE_ENV !== 'production') {
        userCleanupService.start();
    }
}

// For Vercel, we need to export a function that doesn't create an HTTP server
export async function registerVercelRoutes(app: Express): Promise<void> {
    await setupVercelApp(app);
}