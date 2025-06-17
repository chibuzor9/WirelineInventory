import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl) {
  console.error('SUPABASE_URL environment variable is not defined')
  process.exit(1)
}

if (!supabaseKey) {
  console.error('SUPABASE_KEY environment variable is not defined')
  process.exit(1)
}

export const supabase = createClient(supabaseUrl as string, supabaseKey as string)
