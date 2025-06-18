/**
 * Environment configuration utility
 * Loads the appropriate environment variables based on NODE_ENV
 */

import dotenv from 'dotenv';
import path from 'path';

export type Environment = 'development' | 'test' | 'production';

export interface Config {
    nodeEnv: Environment;
    port: number;
    host: string;
    database: {
        url: string;
    };
    supabase: {
        url: string;
        serviceKey: string;
    };
    client: {
        supabase: {
            url: string;
            anonKey: string;
        };
    };
    cors: {
        origins: string[];
    };
    session: {
        secret: string;
        secure: boolean;
    };
}

function loadEnvironment(): void {
    const nodeEnv = (process.env.NODE_ENV || 'development') as Environment;

    // Load environment-specific .env file
    const envFiles = [
        `.env.${ nodeEnv }`,
        '.env.local',
        '.env'
    ];

    for (const envFile of envFiles) {
        const envPath = path.resolve(process.cwd(), envFile);
        dotenv.config({ path: envPath });
    }
}

function validateConfig(): void {
    const required = [
        'DATABASE_URL',
        'SUPABASE_URL',
        'SUPABASE_KEY',
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('Missing required environment variables:', missing);
        console.error('Current NODE_ENV:', process.env.NODE_ENV);
        process.exit(1);
    }

    // Warn about session secret in production
    if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
        console.warn('WARNING: SESSION_SECRET not set in production. Using fallback secret.');
    }
}

function createConfig(): Config {
    loadEnvironment();
    validateConfig();

    const nodeEnv = (process.env.NODE_ENV || 'development') as Environment;

    return {
        nodeEnv,
        port: process.env.PORT ? parseInt(process.env.PORT) : 5000,
        host: nodeEnv === 'production' ? '0.0.0.0' : 'localhost',
        database: {
            url: process.env.DATABASE_URL!,
        },
        supabase: {
            url: process.env.SUPABASE_URL!,
            serviceKey: process.env.SUPABASE_KEY!,
        },
        client: {
            supabase: {
                url: process.env.VITE_SUPABASE_URL!,
                anonKey: process.env.VITE_SUPABASE_ANON_KEY!,
            },
        },
        cors: {
            origins: nodeEnv === 'production'
                ? [
                    process.env.VERCEL_URL ? `https://${ process.env.VERCEL_URL }` : '',
                    process.env.PRODUCTION_URL || '',
                ].filter(Boolean)
                : ['http://localhost:5000', 'http://localhost:5173', 'http://localhost:4173'],
        }, session: {
            secret: process.env.SESSION_SECRET || 'halliburton-inventory-fallback-secret-change-in-production',
            secure: nodeEnv === 'production',
        },
    };
}

export const config = createConfig();

export default config;
