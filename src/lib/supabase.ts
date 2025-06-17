const supabaseUrl = 'https://xlhuozhevoicqpyiynhp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsaHVvemhldm9pY3FweWl5bmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTMyOTksImV4cCI6MjA2NTIyOTI5OX0.3rmWeLAe_1hBU2PYN-B4QmcZuf8f2lUPJoIOLrinxjE';

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