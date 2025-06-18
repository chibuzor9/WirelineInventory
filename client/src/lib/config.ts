export const config = {
    development: {
        api: {
            baseURL: 'http://localhost:5000/api',
        },
        supabase: {
            url: import.meta.env.VITE_SUPABASE_URL,
            anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        features: {
            debugging: true,
            analytics: false,
        }
    },
    test: {
        api: {
            baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
        },
        supabase: {
            url: import.meta.env.VITE_SUPABASE_URL,
            anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        features: {
            debugging: false,
            analytics: false,
        }
    },
    production: {
        api: {
            baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
        },
        supabase: {
            url: import.meta.env.VITE_SUPABASE_URL,
            anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        features: {
            debugging: false,
            analytics: true,
        }
    }
};

const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
export const currentConfig = config[environment as keyof typeof config] || config.development;
