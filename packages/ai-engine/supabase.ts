import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// 1. Get the keys from either Expo (Mobile) or Next.js (Web)
// We add "|| ''" to ensure we never pass 'undefined' to the client
const supabaseUrl = 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  ''; 

const supabaseAnonKey = 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  '';

// 2. Add a quick safety check for debugging
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase credentials not found. Check your .env file!");
}

// 3. Initialize the client with the Database types
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);