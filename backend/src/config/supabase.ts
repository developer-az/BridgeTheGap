import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase credentials not configured. Database features will not work.');
  console.warn('📝 To fix: Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env');
  console.warn('📖 See SETUP_GUIDE.md for instructions\n');
}

// Create a mock client if credentials are missing (allows server to start)
export const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');
