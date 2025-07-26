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

console.log('[DB] Connecting to Supabase...')
console.log('[DB] URL:', supabaseUrl)
console.log('[DB] Key prefix:', supabaseKey?.substring(0, 20) + '...')

export const supabase = createClient(supabaseUrl as string, supabaseKey as string)

// Test connection on startup
async function testConnection() {
  try {
    console.log('[DB] Testing Supabase connection...')
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.error('[DB] Connection test failed:', error)
    } else {
      console.log('[DB] Connection test successful!')
    }
  } catch (err) {
    console.error('[DB] Connection test error:', err)
  }
}

// Test connection with a delay to allow server startup
setTimeout(testConnection, 2000);
