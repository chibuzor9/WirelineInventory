import {
    users,
    tools,
    activities,
    type User,
    type InsertUser,
    type Tool,
    type InsertTool,
    type Activity,
    type InsertActivity,
} from '@shared/schema';
import { supabase } from './db';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import bcrypt from 'bcryptjs';

const MemoryStore = createMemoryStore(session);

export interface IStorage {
    getUser(id: number): Promise<User | undefined>;
    getUserByUsername(username: string): Promise<User | undefined>;
    createUser(user: InsertUser): Promise<User>;
    getTool(id: number): Promise<Tool | undefined>;
    getToolByToolId(toolId: string): Promise<Tool | undefined>;
    getTools(options?: {
        status?: string;
        category?: string;
        search?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ tools: Tool[]; total: number }>;
    createTool(tool: InsertTool): Promise<Tool>;
    updateTool(id: number, tool: Partial<Tool>): Promise<Tool | undefined>;
    deleteTool(id: number): Promise<boolean>;
    createActivity(activity: InsertActivity): Promise<Activity>;
    getActivities(limit?: number): Promise<Activity[]>;
    getToolStats(): Promise<{
        red: number;
        yellow: number;
        green: number;
        white: number;
    }>;
    sessionStore: session.Store;
}

export class SupabaseStorage implements IStorage {
    sessionStore: session.Store;
    constructor() {
        this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
    }

    // User methods
    async getUser(id: number): Promise<User | undefined> {
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
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username);
        if (error) {
            console.error('Error fetching user by username:', error);
            return undefined;
        }
        return data && data[0] ? (data[0] as User) : undefined;
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
    async getTool(id: number): Promise<Tool | undefined> {
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
            .eq('toolId', toolId);
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
        id: number,
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

    async deleteTool(id: number): Promise<boolean> {
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
            new Set(activitiesData.map((a) => a.tool_id).filter(Boolean)),
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
            tool: activity.tool_id ? toolsMap.get(activity.tool_id) : null,
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
            query = query.gte('lastUpdated', filters.startDate);
        }
        if (filters.endDate) {
            query = query.lte('lastUpdated', filters.endDate);
        }

        const { data, error } = await query.order('toolId', { ascending: true });

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
            .order('lastUpdated', { ascending: false });

        if (error) {
            throw new Error('Error fetching tools by status: ' + error.message);
        }

        return data as Tool[];
    }
}

export const storage = new SupabaseStorage();
