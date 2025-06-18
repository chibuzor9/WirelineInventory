import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Direct Supabase configuration for Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

// User type definitions
interface User {
    id: number;
    username: string;
    password: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
}

interface InsertUser {
    username: string;
    password: string;
    full_name: string;
    email: string;
    role: string;
}

// Storage implementation
export const apiStorage = {
    async getUserByUsername(username: string): Promise<User | undefined> {
        console.log(`[STORAGE] Getting user by username: ${ username }`);

        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username);

            if (error) {
                console.error('[STORAGE] Error fetching user:', error);
                throw new Error(`Database error: ${ error.message }`);
            }

            return data && data[0] ? (data[0] as User) : undefined;
        } catch (err) {
            console.error('[STORAGE] Exception in getUserByUsername:', err);
            throw err;
        }
    },

    async createUser(user: InsertUser): Promise<User> {
        console.log(`[STORAGE] Creating user: ${ user.username }`);

        try {
            // Hash password
            const hashedPassword = await bcrypt.hash(user.password, 10);

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

            if (error) {
                console.error('[STORAGE] Error creating user:', error);
                throw new Error(`Database error: ${ error.message }`);
            }

            if (!data) {
                throw new Error('No data returned from user creation');
            }

            console.log(`[STORAGE] User created successfully`);
            return data as User;
        } catch (err) {
            console.error('[STORAGE] Exception in createUser:', err);
            throw err;
        }
    },

    async getUser(id: number): Promise<User | undefined> {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', id);

            if (error) {
                console.error('[STORAGE] Error fetching user by id:', error);
                return undefined;
            }

            return data && data[0] ? (data[0] as User) : undefined;
        } catch (err) {
            console.error('[STORAGE] Exception in getUser:', err);
            return undefined;
        }
    },

    async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (err) {
            console.error('[STORAGE] Password comparison error:', err);
            return false;
        }
    }
};
