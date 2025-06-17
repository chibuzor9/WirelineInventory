import type { Express, Request, Response, NextFunction } from 'express';
import { createServer, type Server } from 'http';
import { storage, IStorage } from './storage';
import { supabase } from './db';
import { setupAuth } from './auth';
import {
    insertToolSchema,
    insertUserSchema,
    toolTagSchema,
    toolCategorySchema,
    reportTypeSchema,
    type InsertUser,
} from '@shared/schema';
import { z } from 'zod';

// Extend Express session type to include supabaseSession and userId
declare module 'express-session' {
    interface SessionData {
        supabaseSession?: {
            access_token: string;
            [key: string]: any;
        };
        userId?: number;
    }
}

// Remove supabaseSession logic and use userId in session
async function getUserFromSession(req: Request) {
    const userId = req.session?.userId;
    if (!userId) return null;
    const user = await storage.getUser(userId);
    return user || null;
}

function isAuthenticated(req: Request): boolean {
    return !!req.session?.userId;
}

export async function registerRoutes(app: Express): Promise<Server> {
    setupAuth(app);

    app.post(
        '/api/login',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { username, password } = req.body;
                console.log(`[LOGIN ATTEMPT] username: ${ username }`);
                const user = await storage.getUserByUsername(username);

                if (!user) {
                    console.log(
                        `[LOGIN FAIL] username: ${ username } (user not found)`,
                    );
                    return res.status(401).send('Invalid username or password');
                }

                // Password comparison based on user role
                let isPasswordValid = false;
                if (user.role === 'admin') {
                    // For admin users, compare password directly (plain text)
                    isPasswordValid = user.password === password;
                } else {
                    // For regular users, use bcrypt comparison (hashed passwords)
                    isPasswordValid = await storage.comparePassword(
                        password,
                        user.password,
                    );
                }

                if (!isPasswordValid) {
                    console.log(
                        `[LOGIN FAIL] username: ${ username } (wrong password)`,
                    );
                    return res.status(401).send('Invalid username or password');
                }

                // Store userId in session
                req.session.userId = user.id;
                console.log(
                    `[LOGIN SUCCESS] username: ${ username }, id: ${ user.id }`,
                );
                res.json(user);
            } catch (error) {
                console.error(
                    `[LOGIN ERROR] username: ${ req.body?.username }`,
                    error,
                );
                next(error);
            }
        },
    );

    app.post('/api/logout', (req, res) => {
        req.session.destroy(() => {
            res.status(200).json({ message: 'Logged out' });
        });
    });

    app.get(
        '/api/user',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                if (!isAuthenticated(req)) return res.sendStatus(401);

                const user = await getUserFromSession(req);
                if (!user) return res.sendStatus(401);

                res.json(user);
            } catch (error) {
                next(error);
            }
        },
    );

    app.get(
        '/api/stats',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                if (!isAuthenticated(req)) return res.sendStatus(401);

                const stats = await storage.getToolStats();
                res.json(stats);
            } catch (error) {
                next(error);
            }
        },
    );

    app.get(
        '/api/tools',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                if (!isAuthenticated(req)) return res.sendStatus(401);

                const status = req.query.status as string | undefined;
                const category = req.query.category as string | undefined;
                const search = req.query.search as string | undefined;
                const page = parseInt(req.query.page as string) || 1;
                const limit = parseInt(req.query.limit as string) || 10;
                const offset = (page - 1) * limit;

                const result = await storage.getTools({
                    status,
                    category,
                    search,
                    limit,
                    offset,
                });

                res.json(result);
            } catch (error) {
                next(error);
            }
        },
    );

    app.get(
        '/api/tools/:id',
        async (
            req: Request<{ id: string }>,
            res: Response,
            next: NextFunction,
        ) => {
            try {
                if (!isAuthenticated(req)) return res.sendStatus(401);

                const id = Number(req.params.id);
                if (isNaN(id)) {
                    return res
                        .status(400)
                        .json({ message: 'Invalid ID format' });
                }

                const tool = await storage.getTool(id);
                if (!tool) {
                    return res.status(404).json({ message: 'Tool not found' });
                }

                res.json(tool);
            } catch (error) {
                next(error);
            }
        },
    );

    app.post(
        '/api/tools',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                if (!isAuthenticated(req)) return res.sendStatus(401);

                const validation = insertToolSchema.safeParse(req.body);
                if (!validation.success) {
                    return res.status(400).json({
                        message: 'Invalid tool data',
                        errors: validation.error.format(),
                    });
                }

                if (!toolTagSchema.safeParse(req.body.status).success) {
                    return res.status(400).json({
                        message:
                            "Invalid tag status. Must be 'red', 'yellow', or 'green'",
                    });
                }

                const user = await getUserFromSession(req);
                if (!user) return res.sendStatus(401);

                const toolData = {
                    ...req.body,
                    lastUpdated: new Date(),
                    lastUpdatedBy: Number(user.id),
                };

                const tool = await storage.createTool(toolData);

                await storage.createActivity({
                    userId: Number(user.id),
                    action: 'create',
                    toolId: tool.id,
                    timestamp: new Date(),
                    details: `Created tool ${ tool.name } (${ tool.toolId }) with ${ tool.status } tag`,
                });

                res.status(201).json(tool);
            } catch (error) {
                next(error);
            }
        },
    );

    app.put(
        '/api/tools/:id',
        async (
            req: Request<{ id: string }>,
            res: Response,
            next: NextFunction,
        ) => {
            try {
                if (!isAuthenticated(req)) return res.sendStatus(401);

                const id = Number(req.params.id);
                if (isNaN(id)) {
                    return res
                        .status(400)
                        .json({ message: 'Invalid ID format' });
                }

                const existingTool = await storage.getTool(id);
                if (!existingTool) {
                    return res.status(404).json({ message: 'Tool not found' });
                }

                if (
                    req.body.status &&
                    req.body.status !== existingTool.status
                ) {
                    if (!toolTagSchema.safeParse(req.body.status).success) {
                        return res.status(400).json({
                            message:
                                "Invalid tag status. Must be 'red', 'yellow', or 'green'",
                        });
                    }
                }

                const user = await getUserFromSession(req);
                if (!user) return res.sendStatus(401);

                const toolUpdate = {
                    ...req.body,
                    lastUpdated: new Date(),
                    lastUpdatedBy: Number(user.id),
                };

                const updatedTool = await storage.updateTool(id, toolUpdate);

                if (
                    req.body.status &&
                    req.body.status !== existingTool.status
                ) {
                    await storage.createActivity({
                        userId: Number(user.id),
                        action: 'update',
                        toolId: id,
                        timestamp: new Date(),
                        details: `Changed tag for ${ updatedTool?.name } (${ updatedTool?.toolId }) from ${ existingTool.status } to ${ req.body.status }`,
                        comments: req.body.comment || '',
                        previousStatus: existingTool.status,
                    });
                } else {
                    await storage.createActivity({
                        userId: Number(user.id),
                        action: 'update',
                        toolId: id,
                        timestamp: new Date(),
                        details: `Updated tool ${ updatedTool?.name } (${ updatedTool?.toolId })`,
                        comments: req.body.comment || '',
                        previousStatus: undefined,
                    });
                }

                res.json(updatedTool);
            } catch (error) {
                next(error);
            }
        },
    );

    app.delete(
        '/api/tools/:id',
        async (
            req: Request<{ id: string }>,
            res: Response,
            next: NextFunction,
        ) => {
            try {
                if (!isAuthenticated(req)) return res.sendStatus(401);

                const id = Number(req.params.id);
                if (isNaN(id)) {
                    return res
                        .status(400)
                        .json({ message: 'Invalid ID format' });
                }

                const tool = await storage.getTool(id);
                if (!tool) {
                    return res.status(404).json({ message: 'Tool not found' });
                }

                await storage.deleteTool(id);

                const user = await getUserFromSession(req);
                if (!user) return res.sendStatus(401);

                await storage.createActivity({
                    userId: Number(user.id),
                    action: 'delete',
                    toolId: id,
                    timestamp: new Date(),
                    details: `Deleted tool ${ tool.name } (${ tool.toolId })`,
                });

                res.status(204).send();
            } catch (error) {
                next(error);
            }
        },
    );

    app.get(
        '/api/activities',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                if (!isAuthenticated(req)) return res.sendStatus(401);

                const limit = req.query.limit
                    ? parseInt(req.query.limit as string)
                    : 10;
                const activities = await storage.getActivities(limit);

                // Activities now come with related data from the join query
                const enrichedActivities = activities.map((activity: any) => ({
                    ...activity,
                    timestamp: new Date(activity.timestamp).toISOString(),
                    user: activity.users || null,
                    tool: activity.tools || null,
                }));

                res.json(enrichedActivities);
            } catch (error) {
                console.error('Activities API error:', error);
                next(error);
            }
        },
    );

    app.post(
        '/api/reports',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                if (!isAuthenticated(req)) return res.sendStatus(401);

                const reportTypeValidation = reportTypeSchema.safeParse(
                    req.body.reportType,
                );
                if (!reportTypeValidation.success) {
                    return res
                        .status(400)
                        .json({ message: 'Invalid report type' });
                }

                const tagsValidation = z
                    .array(toolTagSchema)
                    .safeParse(req.body.tags);
                if (!tagsValidation.success) {
                    return res
                        .status(400)
                        .json({ message: 'Invalid tag selection' });
                }

                const dateRangeSchema = z.object({
                    startDate: z.string().optional(),
                    endDate: z.string().optional(),
                });

                const dateRangeValidation = dateRangeSchema.safeParse({
                    startDate: req.body.startDate,
                    endDate: req.body.endDate,
                });

                if (!dateRangeValidation.success) {
                    return res
                        .status(400)
                        .json({ message: 'Invalid date range' });
                }

                const user = await getUserFromSession(req);
                if (!user) return res.sendStatus(401);

                await storage.createActivity({
                    userId: Number(user.id),
                    action: 'report',
                    timestamp: new Date(),
                    details: `Generated ${ req.body.reportType } report for ${ req.body.tags.join(', ') } tagged tools`,
                });

                res.json({
                    success: true,
                    message: 'Report generated successfully',
                    reportType: req.body.reportType,
                    tags: req.body.tags,
                    dateRange: {
                        startDate: req.body.startDate,
                        endDate: req.body.endDate,
                    },
                    format: req.body.format || 'pdf',
                });
            } catch (error) {
                next(error);
            }
        },
    );

    app.post('/api/register', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username, password, full_name, email } = req.body;

            // Validate required fields
            if (!username || !password || !full_name || !email) {
                return res.status(400).json({ message: 'All fields are required' });
            }

            console.log('[REGISTER] Received data:', {
                username,
                full_name,
                email,
                hasPassword: !!password,
            });

            // Check if user already exists
            const existing = await storage.getUserByUsername(username);
            if (existing) {
                return res
                    .status(409)
                    .json({ message: 'Username already exists' });
            }

            // Validate and create user data
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

            const user = await storage.createUser(userData);
            req.session.userId = user.id;
            res.status(201).json(user);
        } catch (error) {
            next(error);
        }
    });

    const httpServer = createServer(app);
    return httpServer;
}
