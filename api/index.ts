import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { setupRoutes } from '../server/routes';
import 'dotenv/config';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize routes without creating HTTP server
await setupRoutes(app);

// Export the Express app as a Vercel function
export default async function handler(req: VercelRequest, res: VercelResponse) {
    return app(req, res);
}