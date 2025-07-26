import {
    users,
    tools,
    activities,
    otpCodes,
    type User,
    type InsertUser,
    type Tool,
    type InsertTool,
    type Activity,
    type InsertActivity,
    type OtpCode,
    type InsertOtpCode,
} from '../shared/schema.js';
import { supabase } from './db.js';
import session from 'express-session';
import ConnectPgSimple from 'connect-pg-simple';
import bcrypt from 'bcryptjs';

const PgSession = ConnectPgSimple(session);

export interface IStorage {
    getUser(id: string): Promise<User | undefined>;
    getUserByUsername(username: string): Promise<User | undefined>;
    getAllUsers(): Promise<User[]>;
    createUser(user: InsertUser): Promise<User>;
    updateUserPassword(id: string, newPassword: string): Promise<void>;
    scheduleUserDeletion(id: string, scheduledAt: Date): Promise<void>;
    cancelUserDeletion(id: string): Promise<void>;
    permanentlyDeleteUser(id: string): Promise<boolean>;
    getUsersScheduledForDeletion(): Promise<User[]>;
    getTool(id: string): Promise<Tool | undefined>;
    getToolByToolId(toolId: string): Promise<Tool | undefined>;
    getTools(options?: {
        status?: string;
        category?: string;
        search?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ tools: Tool[]; total: number }>;
    createTool(tool: InsertTool): Promise<Tool>;
    updateTool(id: string, tool: Partial<Tool>): Promise<Tool | undefined>;
    deleteTool(id: string): Promise<boolean>;
    createActivity(activity: InsertActivity): Promise<Activity>;
    logActivity(activity: Omit<InsertActivity, 'user_id'> & { user_id: string }): Promise<Activity>;
    getActivities(limit?: number): Promise<Activity[]>;
    getToolStats(): Promise<{
        red: number;
        yellow: number;
        green: number;
        white: number;
    }>;
    getToolsByStatus(statuses: string[]): Promise<Tool[]>;
    createOtpCode(otpCode: InsertOtpCode): Promise<OtpCode>;
    getValidOtpCode(email: string, code: string, type: string): Promise<OtpCode | undefined>;
    markOtpCodeAsUsed(id: string): Promise<boolean>;
    cleanupExpiredOtpCodes(): Promise<void>;
    markEmailAsVerified(userId: string): Promise<boolean>;
    sessionStore: session.Store;
}

export class SupabaseStorage implements IStorage {
    sessionStore: session.Store;
    constructor() {
        // Use PostgreSQL-backed sessions for production
        this.sessionStore = new PgSession({
            conString: process.env.DATABASE_URL,
            tableName: 'user_sessions',
            createTableIfMissing: true,
            ttl: 24 * 60 * 60 // 24 hours
        });
    }

    // User methods
    async getUser(id: string): Promise<User | undefined> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id);
        if (error) {
            console.error('Error fetching user by id:', error);
            return undefined;
        }
        return data && data[0] ? (data[0] as User) : undefined;
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        try {
            console.log(`[STORAGE] Fetching user by username: ${username}`);
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username);
            
            if (error) {
                console.error('Error fetching user by username:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                return undefined;
            }
            
            console.log(`[STORAGE] Query result for ${username}:`, {
                found: !!data?.[0],
                count: data?.length || 0
            });
            
            return data && data[0] ? (data[0] as User) : undefined;
        } catch (err) {
            console.error('Unexpected error in getUserByUsername:', err);
            return undefined;
        }
    }

    async createUser(user: InsertUser): Promise<User> {
        // Hash password for regular users
        const hashedPassword = await bcrypt.hash(user.password as string, 10);

        const dbUser = {
            username: user.username,
            password: hashedPassword,
            full_name: user.full_name,
            email: user.email,
            role: 'user',
        };

        const { data, error } = await supabase
            .from('users')
            .insert([dbUser])
            .select()
            .single();
        if (error || !data) {
            throw new Error(
                'Error creating user: ' + (error?.message || 'Unknown error'),
            );
        }

        return data as User;
    }

    async updateUserPassword(id: string, newPassword: string): Promise<void> {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const { error } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', id);

        if (error) {
            throw new Error(
                'Error updating password: ' + error.message,
            );
        }
    }

    // Helper method to check if password is already hashed
    private isPasswordHashed(password: string): boolean {
        // Bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long
        return /^\$2[aby]\$\d+\$/.test(password) && password.length === 60;
    }

    // Method to compare passwords (works with both hashed and plain text)
    async comparePassword(
        inputPassword: string,
        storedPassword: string,
    ): Promise<boolean> {
        // If stored password is hashed, use bcrypt compare
        if (this.isPasswordHashed(storedPassword)) {
            return await bcrypt.compare(inputPassword, storedPassword);
        }
        // If stored password is plain text (admin entries), compare directly
        return inputPassword === storedPassword;
    }

    // Tool methods
    async getTool(id: string): Promise<Tool | undefined> {
        const { data, error } = await supabase
            .from('tools')
            .select('*')
            .eq('id', id);
        if (error) {
            console.error('Error fetching tool by id:', error);
            return undefined;
        }
        return data && data[0] ? (data[0] as Tool) : undefined;
    }

    async getToolByToolId(toolId: string): Promise<Tool | undefined> {
        const { data, error } = await supabase
            .from('tools')
            .select('*')
            .eq('tool_id', toolId);
        if (error) {
            console.error('Error fetching tool by toolId:', error);
            return undefined;
        }
        return data && data[0] ? (data[0] as Tool) : undefined;
    }

    async getTools(options?: {
        status?: string;
        category?: string;
        search?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ tools: Tool[]; total: number }> {
        let query = supabase.from('tools').select('*', { count: 'exact' });
        if (options?.status) query = query.eq('status', options.status);
        if (options?.category) query = query.eq('category', options.category);
        if (options?.search) query = query.ilike('name', `%${ options.search }%`);
        if (options?.limit) query = query.limit(options.limit);
        if (options?.offset)
            query = query.range(
                options.offset,
                (options.offset || 0) + (options.limit || 10) - 1,
            );
        const { data, error, count } = await query;
        if (error) {
            console.error('Error fetching tools:', error);
            return { tools: [], total: 0 };
        }
        return { tools: (data as Tool[]) || [], total: count || 0 };
    }

    async createTool(tool: InsertTool): Promise<Tool> {
        const { data, error } = await supabase
            .from('tools')
            .insert([tool])
            .select()
            .single();
        if (error || !data) {
            throw new Error(
                'Error creating tool: ' + (error?.message || 'Unknown error'),
            );
        }
        return data as Tool;
    }

    async updateTool(
        id: string,
        tool: Partial<Tool>,
    ): Promise<Tool | undefined> {
        const { data, error } = await supabase
            .from('tools')
            .update(tool)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Error updating tool:', error);
            return undefined;
        }
        return data as Tool;
    }

    async deleteTool(id: string): Promise<boolean> {
        const { error } = await supabase.from('tools').delete().eq('id', id);
        if (error) {
            console.error('Error deleting tool:', error);
            return false;
        }
        return true;
    }

    // Activity methods
    async createActivity(activity: InsertActivity): Promise<Activity> {
        const { data, error } = await supabase
            .from('activities')
            .insert([activity])
            .select()
            .single();

        if (error || !data) {
            throw new Error(
                'Error creating activity: ' +
                (error?.message || 'Unknown error'),
            );
        }
        return data as Activity;
    }

    async getActivities(limit: number = 10): Promise<Activity[]> {
        // First, get activities without joins
        const { data: activitiesData, error: activitiesError } = await supabase
            .from('activities')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (activitiesError) {
            console.error('Error fetching activities:', activitiesError);
            return [];
        }

        if (!activitiesData || activitiesData.length === 0) {
            return [];
        }

        // Get unique user IDs and tool IDs
        const userIds = Array.from(
            new Set(activitiesData.map((a) => a.user_id).filter(Boolean)),
        );
        const toolIds = Array.from(
            new Set(activitiesData.map((a) => a.toolId).filter(Boolean)),
        );

        // Fetch users and tools separately
        const [usersResult, toolsResult] = await Promise.all([
            userIds.length > 0
                ? supabase
                    .from('users')
                    .select('id, username, full_name')
                    .in('id', userIds)
                : { data: [], error: null },
            toolIds.length > 0
                ? supabase
                    .from('tools')
                    .select('id, tool_id, name, status')
                    .in('id', toolIds)
                : { data: [], error: null },
        ]);

        // Create lookup maps
        const usersMap = new Map(usersResult.data?.map((u) => [u.id, u]) || []);
        const toolsMap = new Map(toolsResult.data?.map((t) => [t.id, t]) || []);

        // Combine the data
        const enrichedActivities = activitiesData.map((activity) => ({
            ...activity,
            user: activity.user_id ? usersMap.get(activity.user_id) : null,
            tool: activity.toolId ? toolsMap.get(activity.toolId) : null,
        }));

        return enrichedActivities as Activity[];
    }

    async getToolStats(): Promise<{
        red: number;
        yellow: number;
        green: number;
        white: number;
    }> {
        const { data, error } = await supabase.from('tools').select('status');
        if (error || !data) {
            console.error('Error fetching tool stats:', error);
            return { red: 0, yellow: 0, green: 0, white: 0 };
        }
        const stats = { red: 0, yellow: 0, green: 0, white: 0 };
        for (const tool of data) {
            if (tool.status === 'red') stats.red++;
            if (tool.status === 'yellow') stats.yellow++;
            if (tool.status === 'green') stats.green++;
            if (tool.status === 'white') stats.white++;
        }
        return stats;
    }

    async getToolsForReport(filters: {
        tags?: string[];
        startDate?: string;
        endDate?: string;
    }): Promise<Tool[]> {
        let query = supabase.from('tools').select('*');

        // Filter by tags (status)
        if (filters.tags && filters.tags.length > 0) {
            query = query.in('status', filters.tags);
        }

        // Filter by date range
        if (filters.startDate) {
            query = query.gte('last_updated', filters.startDate);
        }
        if (filters.endDate) {
            query = query.lte('last_updated', filters.endDate);
        }

        const { data, error } = await query.order('tool_id', { ascending: true });

        if (error) {
            throw new Error('Error fetching tools for report: ' + error.message);
        }

        return data as Tool[];
    }

    async getToolsByStatus(statuses: string[]): Promise<Tool[]> {
        const { data, error } = await supabase
            .from('tools')
            .select('*')
            .in('status', statuses)
            .order('last_updated', { ascending: false });

        if (error) {
            throw new Error('Error fetching tools by status: ' + error.message);
        }

        return data as Tool[];
    }

    async getAllUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error('Error fetching users: ' + error.message);
        }

        return data as User[];
    }

    async scheduleUserDeletion(id: string, scheduledAt: Date): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ 
                deletion_scheduled_at: scheduledAt.toISOString(),
                status: 0 // Mark as inactive
            })
            .eq('id', id);

        if (error) {
            throw new Error('Error scheduling user deletion: ' + error.message);
        }
    }

    async cancelUserDeletion(id: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ 
                deletion_scheduled_at: null,
                status: 1 // Mark as active
            })
            .eq('id', id);

        if (error) {
            throw new Error('Error cancelling user deletion: ' + error.message);
        }
    }

    async permanentlyDeleteUser(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error('Error permanently deleting user: ' + error.message);
        }

        return true;
    }

    async getUsersScheduledForDeletion(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .not('deletion_scheduled_at', 'is', null)
            .order('deletion_scheduled_at', { ascending: true });

        if (error) {
            throw new Error('Error fetching users scheduled for deletion: ' + error.message);
        }

        return data as User[];
    }

    async logActivity(activity: Omit<InsertActivity, 'user_id'> & { user_id: string }): Promise<Activity> {
        return this.createActivity(activity as InsertActivity);
    }

    async createOtpCode(otpCode: InsertOtpCode): Promise<OtpCode> {
        const { data, error } = await supabase
            .from('otp_codes')
            .insert([otpCode])
            .select()
            .single();

        if (error || !data) {
            throw new Error(
                'Error creating OTP code: ' + (error?.message || 'Unknown error'),
            );
        }

        return data as OtpCode;
    }

    async getValidOtpCode(email: string, code: string, type: string): Promise<OtpCode | undefined> {
        const { data, error } = await supabase
            .from('otp_codes')
            .select('*')
            .eq('email', email)
            .eq('code', code)
            .eq('type', type)
            .is('used_at', null)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error fetching OTP code:', error);
            return undefined;
        }

        return data && data[0] ? (data[0] as OtpCode) : undefined;
    }

    async markOtpCodeAsUsed(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('otp_codes')
            .update({ used_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Error marking OTP code as used:', error);
            return false;
        }

        return true;
    }

    async cleanupExpiredOtpCodes(): Promise<void> {
        const { error } = await supabase
            .from('otp_codes')
            .delete()
            .lt('expires_at', new Date().toISOString());

        if (error) {
            console.error('Error cleaning up expired OTP codes:', error);
        }
    }

    async markEmailAsVerified(userId: string): Promise<boolean> {
        const { error } = await supabase
            .from('users')
            .update({ email_verified: new Date().toISOString() })
            .eq('id', userId);

        if (error) {
            console.error('Error marking email as verified:', error);
            return false;
        }

        return true;
    }
}

export const storage = new SupabaseStorage();
