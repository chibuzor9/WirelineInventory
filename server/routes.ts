import type { Express, Request, Response, NextFunction } from 'express';
import { createServer, type Server } from 'http';
import { storage, IStorage } from './storage';
import { supabase } from './db';
import { setupAuth } from './auth';
import { emailService } from './email';
import { userCleanupService } from './cleanup';
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

// Helper functions for notifications
function getNotificationType(action: string, details: string): string {
    if (action === 'create') return 'success';
    if (action === 'delete') return 'error';
    if (action === 'update' && details.includes('Red')) return 'error';
    if (action === 'update' && details.includes('Yellow')) return 'warning';
    if (action === 'update' && details.includes('Green')) return 'success';
    if (action === 'report') return 'info';
    return 'info';
}

function getNotificationTitle(action: string, details: string): string {
    switch (action) {
        case 'create':
            return 'New Tool Added';
        case 'update':
            if (details.includes('tag')) {
                return 'Tool Status Changed';
            }
            return 'Tool Updated';
        case 'delete':
            return 'Tool Removed';
        case 'report':
            return 'Report Generated';
        default:
            return 'System Activity';
    }
}

export async function registerRoutes(app: Express): Promise<Server> {
    await setupRoutes(app);
    
    const httpServer = createServer(app);
    
    // Start cleanup service for local development only
    if (process.env.NODE_ENV === 'development') {
        userCleanupService.start();
    }
    
    return httpServer;
}

// Separate function for Vercel deployment (no HTTP server creation)
export async function setupRoutes(app: Express): Promise<void> {
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

                // Password comparison - use bcrypt for all users
                const isPasswordValid = await storage.comparePassword(
                    password,
                    user.password,
                );

                if (!isPasswordValid) {
                    console.log(
                        `[LOGIN FAIL] username: ${ username } (wrong password)`,
                    );
                    return res.status(401).send('Invalid username or password');
                }                // Store userId in session
                req.session.userId = Number(user.id); console.log(
                    `[LOGIN SUCCESS] username: ${ username }, id: ${ Number(user.id) }`,
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

                const user = await getUserFromSession(req);
                if (!user) return res.sendStatus(401);

                // Check if user has admin role
                if (user.role !== 'admin') {
                    return res.status(403).json({
                        message: 'Access denied. Admin role required to create tools.',
                    });
                }

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

                const toolData = {
                    ...req.body,
                    lastUpdated: new Date(),
                    lastUpdatedBy: Number(user.id),
                };

                const tool = await storage.createTool(toolData); await storage.createActivity({
                    user_id: Number(user.id),
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

                const user = await getUserFromSession(req);
                if (!user) return res.sendStatus(401);

                // Allow all authenticated users to edit tools
                // Admin users can edit everything, regular users can edit status and comments

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
                        user_id: Number(user.id),
                        action: 'update',
                        toolId: id,
                        timestamp: new Date(),
                        details: `Changed tag for ${ updatedTool?.name } (${ updatedTool?.toolId }) from ${ existingTool.status } to ${ req.body.status }`,
                        comments: req.body.comment || '',
                        previous_status: existingTool.status,
                    });
                } else {
                    await storage.createActivity({
                        user_id: Number(user.id),
                        action: 'update',
                        toolId: id,
                        timestamp: new Date(),
                        details: `Updated tool ${ updatedTool?.name } (${ updatedTool?.toolId })`,
                        comments: req.body.comment || '',
                        previous_status: undefined,
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

                const user = await getUserFromSession(req);
                if (!user) return res.sendStatus(401);

                // Check if user has admin role
                if (user.role !== 'admin') {
                    return res.status(403).json({
                        message: 'Access denied. Admin role required to delete tools.',
                    });
                }

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

                await storage.deleteTool(id); await storage.createActivity({
                    user_id: Number(user.id),
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

                // Activities now come with related data from the enriched query
                const enrichedActivities = activities.map((activity: any) => ({
                    ...activity,
                    timestamp: new Date(activity.timestamp).toISOString(),
                    // user and tool are already included from storage
                }));

                res.json(enrichedActivities);
            } catch (error) {
                console.error('Activities API error:', error);
                next(error);
            }
        },
    ); app.post(
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
                } const user = await getUserFromSession(req);
                if (!user) return res.sendStatus(401);

                // Get filtered tools for the report
                const tools = await storage.getToolsForReport({
                    tags: req.body.tags,
                    startDate: req.body.startDate,
                    endDate: req.body.endDate,
                });

                const reportData = {
                    tools,
                    reportType: req.body.reportType,
                    tags: req.body.tags,
                    startDate: req.body.startDate,
                    endDate: req.body.endDate,
                    generatedBy: user.full_name || user.username,
                    generatedAt: new Date(),
                };

                const format = req.body.format || 'pdf';
                let buffer: Buffer;
                let contentType: string;
                let fileName: string;

                switch (format) {
                    case 'csv': {
                        const { generateCSV } = await import('./utils/export-generator');
                        const csvContent = generateCSV(reportData);
                        buffer = Buffer.from(csvContent, 'utf-8');
                        contentType = 'text/csv';
                        fileName = `wireline-report-${ req.body.reportType }-${ new Date().toISOString().split('T')[0] }.csv`;
                        break;
                    }
                    case 'excel': {
                        const { generateExcel } = await import('./utils/export-generator');
                        buffer = generateExcel(reportData);
                        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                        fileName = `wireline-report-${ req.body.reportType }-${ new Date().toISOString().split('T')[0] }.xlsx`;
                        break;
                    }
                    default: {
                        const { generateReportPDF } = await import('./utils/pdf-generator');
                        buffer = await generateReportPDF(reportData);
                        contentType = 'application/pdf';
                        fileName = `wireline-report-${ req.body.reportType }-${ new Date().toISOString().split('T')[0] }.pdf`;
                        break;
                    }
                }

                // Log the activity
                await storage.createActivity({
                    user_id: Number(user.id),
                    action: 'report',
                    timestamp: new Date(),
                    details: `Generated ${ req.body.reportType } report (${ format.toUpperCase() }) for ${ req.body.tags.join(', ') || 'all' } tagged tools`,
                });

                // Set response headers for download
                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${ fileName }"`);
                res.setHeader('Content-Length', buffer.length);

                // Send the file
                res.send(buffer);
            } catch (error) {
                console.error('Report generation error:', error);
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
            }; const user = await storage.createUser(userData);
            req.session.userId = Number(user.id);
            res.status(201).json(user);
        } catch (error) {
            next(error);
        }
    });

    // Admin user management endpoints
    app.get('/api/admin/users', async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!isAuthenticated(req)) return res.sendStatus(401);
            
            const user = await getUserFromSession(req);
            if (!user || user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Admin role required.' });
            }

            // Get all users including soft-deleted ones for admin view
            const users = await storage.getAllUsers();
            
            // Filter out passwords and add additional info
            const sanitizedUsers = users.map(u => ({
                ...u,
                password: undefined,
                isScheduledForDeletion: !!u.deletion_scheduled_at,
                daysToDeletion: u.deletion_scheduled_at ? 
                    Math.ceil((new Date(u.deletion_scheduled_at).getTime() + (30 * 24 * 60 * 60 * 1000) - Date.now()) / (24 * 60 * 60 * 1000)) : null
            }));

            res.json(sanitizedUsers);
        } catch (error) {
            next(error);
        }
    });

    app.post('/api/admin/users', async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!isAuthenticated(req)) return res.sendStatus(401);
            
            const adminUser = await getUserFromSession(req);
            if (!adminUser || adminUser.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Admin role required.' });
            }

            const { username, password, full_name, email, role = 'user' } = req.body;

            if (!username || !password || !full_name || !email) {
                return res.status(400).json({ message: 'All fields are required' });
            }

            // Check if user already exists
            const existing = await storage.getUserByUsername(username);
            if (existing) {
                return res.status(409).json({ message: 'Username already exists' });
            }

            const validatedData = insertUserSchema.parse({
                username,
                password,
                full_name,
                email,
                role
            });

            const userData: InsertUser = {
                username: validatedData.username,
                password: validatedData.password,
                full_name: validatedData.full_name,
                email: validatedData.email,
                role: validatedData.role,
            };

            const user = await storage.createUser(userData);
            
            // Log admin action
            await storage.logActivity({
                user_id: Number(adminUser.id),
                action: 'admin_create_user',
                timestamp: new Date(),
                details: `Created user: ${username} with role: ${role}`,
            });

            res.status(201).json({ ...user, password: undefined });
        } catch (error) {
            next(error);
        }
    });

    app.delete('/api/admin/users/:userId', async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!isAuthenticated(req)) return res.sendStatus(401);
            
            const adminUser = await getUserFromSession(req);
            if (!adminUser || adminUser.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Admin role required.' });
            }

            const { userId } = req.params;
            const targetUser = await storage.getUser(Number(userId));
            
            if (!targetUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Prevent admin from deleting themselves
            if (Number(userId) === Number(adminUser.id)) {
                return res.status(400).json({ message: 'Cannot delete your own account' });
            }

            // Schedule user for deletion (soft delete)
            const deletionScheduledAt = new Date();
            await storage.scheduleUserDeletion(Number(userId), deletionScheduledAt);

            // Log admin action
            await storage.logActivity({
                user_id: Number(adminUser.id),
                action: 'admin_schedule_deletion',
                timestamp: new Date(),
                details: `Scheduled user ${targetUser.username} for deletion in 30 days`,
            });

            // Send email notification to user about scheduled deletion
            try {
                await emailService.sendDeletionWarningEmail(
                    targetUser.email,
                    targetUser.full_name,
                    deletionScheduledAt
                );
            } catch (emailError) {
                console.error('Failed to send deletion warning email:', emailError);
                // Continue with the response even if email fails
            }

            res.json({ 
                message: 'User scheduled for deletion in 30 days',
                scheduledDeletionDate: new Date(deletionScheduledAt.getTime() + (30 * 24 * 60 * 60 * 1000))
            });
        } catch (error) {
            next(error);
        }
    });

    app.put('/api/admin/users/:userId/restore', async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!isAuthenticated(req)) return res.sendStatus(401);
            
            const adminUser = await getUserFromSession(req);
            if (!adminUser || adminUser.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Admin role required.' });
            }

            const { userId } = req.params;
            const targetUser = await storage.getUser(Number(userId));
            
            if (!targetUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Restore user (cancel deletion)
            await storage.cancelUserDeletion(Number(userId));

            // Log admin action
            await storage.logActivity({
                user_id: Number(adminUser.id),
                action: 'admin_restore_user',
                timestamp: new Date(),
                details: `Restored user ${targetUser.username} - cancelled scheduled deletion`,
            });

            // Send email notification to user about account restoration
            try {
                await emailService.sendAccountRestoredEmail(
                    targetUser.email,
                    targetUser.full_name
                );
            } catch (emailError) {
                console.error('Failed to send account restored email:', emailError);
                // Continue with the response even if email fails
            }

            res.json({ message: 'User restored successfully' });
        } catch (error) {
            next(error);
        }
    });

    // Admin cleanup management endpoints
    app.get('/api/admin/cleanup/status', async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!isAuthenticated(req)) return res.sendStatus(401);
            
            const user = await getUserFromSession(req);
            if (!user || user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Admin role required.' });
            }

            const status = userCleanupService.getStatus();
            const scheduledUsers = await storage.getUsersScheduledForDeletion();
            
            res.json({
                cleanupService: status,
                scheduledUsers: scheduledUsers.map(u => ({
                    id: u.id,
                    username: u.username,
                    email: u.email,
                    deletion_scheduled_at: u.deletion_scheduled_at,
                    daysRemaining: u.deletion_scheduled_at ? 
                        Math.ceil((new Date(u.deletion_scheduled_at).getTime() + (30 * 24 * 60 * 60 * 1000) - Date.now()) / (24 * 60 * 60 * 1000)) : null
                }))
            });
        } catch (error) {
            next(error);
        }
    });

    app.post('/api/admin/cleanup/run', async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!isAuthenticated(req)) return res.sendStatus(401);
            
            const user = await getUserFromSession(req);
            if (!user || user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Admin role required.' });
            }

            const result = await userCleanupService.runManualCleanup();
            
            // Log admin action
            await storage.logActivity({
                user_id: Number(user.id),
                action: 'admin_manual_cleanup',
                timestamp: new Date(),
                details: `Manual cleanup: ${result.deletedUsers} deleted, ${result.remindersSent} reminders sent`,
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    });

    app.get(
        '/api/notifications',
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                if (!isAuthenticated(req)) return res.sendStatus(401);

                const user = await getUserFromSession(req);
                if (!user) return res.sendStatus(401);

                // Get recent activities and convert them to notifications
                const activities = await storage.getActivities(20); // Get last 20 activities

                // Get tools that need attention (red/yellow status)
                const alertTools = await storage.getToolsByStatus(['red', 'yellow']);

                // Create notifications from activities
                const activityNotifications = activities.map((activity: any, index: number) => ({
                    id: `activity-${ activity.id }`,
                    type: getNotificationType(activity.action, activity.details),
                    title: getNotificationTitle(activity.action, activity.details),
                    message: activity.details || `${ activity.action } performed`,
                    timestamp: activity.timestamp,
                    read: false,
                    source: 'activity',
                    data: activity
                }));

                // Create notifications for tools needing attention
                const toolNotifications = alertTools.slice(0, 5).map((tool: any) => ({
                    id: `tool-${ tool.id }`,
                    type: tool.status === 'red' ? 'error' : 'warning',
                    title: `Tool Attention Required`,
                    message: `${ tool.name } (${ tool.toolId }) has ${ tool.status } status and may need attention`,
                    timestamp: tool.lastUpdated,
                    read: false,
                    source: 'tool',
                    data: tool
                }));

                // Combine and sort notifications by timestamp
                const allNotifications = [...activityNotifications, ...toolNotifications]
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 15); // Limit to 15 most recent

                res.json(allNotifications);
            } catch (error) {
                console.error('Notifications API error:', error);
                next(error);
            }
        },
    );
}
