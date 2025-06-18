import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' :
    process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

dotenv.config({ path: envFile });

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl) {
    console.error('SUPABASE_URL environment variable is not defined')
    console.error(`Loaded environment file: ${ envFile }`)
    process.exit(1)
}

if (!supabaseKey) {
    console.error('SUPABASE_KEY environment variable is not defined')
    console.error(`Loaded environment file: ${ envFile }`)
    process.exit(1)
}

export const supabase = createClient(supabaseUrl as string, supabaseKey as string)
