const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Only import and create Supabase client if environment variables are available
let supabase: any = null;

if (isSupabaseConfigured()) {
  const { createClient } = await import('@supabase/supabase-js');
  supabase = createClient(supabaseUrl!, supabaseAnonKey!);
}

export { supabase };

// Mock functions for when Supabase is not configured
export const mockSupabaseResponse = {
  data: null,
  error: { message: 'Supabase not configured. Please connect to Supabase first.' }
};

// Helper function to check if we should use mock data
export const shouldUseMockData = () => !isSupabaseConfigured();