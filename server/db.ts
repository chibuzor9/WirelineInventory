import { createClient } from '@supabase/supabase-js'

// In production (Vercel), environment variables are set through dashboard
// No need to load .env files
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

console.log('[DB] Environment check:', {
    nodeEnv: process.env.NODE_ENV,
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseKey: !!supabaseKey,
    supabaseUrlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined'
});

if (!supabaseUrl) {
    console.error('SUPABASE_URL environment variable is not defined')
    console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')))
    throw new Error('SUPABASE_URL is required')
}

if (!supabaseKey) {
    console.error('SUPABASE_KEY environment variable is not defined')
    console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')))
    throw new Error('SUPABASE_KEY is required')
}

console.log('[DB] Creating Supabase client...');

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false, // Disable session persistence for server-side
        autoRefreshToken: false
    }
})

// Test the connection
supabase
    .from('users')
    .select('count')
    .limit(1)
    .then(({ data, error }) => {
        if (error) {
            console.error('[DB] Connection test failed:', error);
        } else {
            console.log('[DB] Connection test successful');
        }
    })
    .catch(err => {
        console.error('[DB] Connection test error:', err);
    });
