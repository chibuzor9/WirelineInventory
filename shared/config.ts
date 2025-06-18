// Environment Configuration Utility
export const config = {
    // Environment detection
    isDev: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
    isProd: process.env.NODE_ENV === 'production',

    // Server configuration
    port: process.env.PORT ? parseInt(process.env.PORT) : 5000,
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',

    // Database
    databaseUrl: process.env.DATABASE_URL || '',

    // Supabase
    supabase: {
        url: process.env.SUPABASE_URL || '',
        key: process.env.SUPABASE_KEY || '',
    },

    // Security
    sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',

    // Client-side environment indicator
    environment: process.env.VITE_ENVIRONMENT || 'development',
} as const;

// Validation function
export function validateConfig() {
    const required = ['databaseUrl', 'supabase.url', 'supabase.key'];
    const missing: string[] = [];

    if (!config.databaseUrl) missing.push('DATABASE_URL');
    if (!config.supabase.url) missing.push('SUPABASE_URL');
    if (!config.supabase.key) missing.push('SUPABASE_KEY');

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${ missing.join(', ') }`);
    }

    if (config.isProd && config.sessionSecret === 'dev-secret-change-in-production') {
        console.warn('⚠️  WARNING: Using default session secret in production!');
    }

    console.log(`🌍 Environment: ${ process.env.NODE_ENV || 'development' }`);
    console.log(`🚀 Server will run on: ${ config.host }:${ config.port }`);
}
