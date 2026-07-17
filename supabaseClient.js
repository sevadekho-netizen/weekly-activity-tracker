import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export const SUPABASE_URL = 'https://tqbmnghneymspwsaingt.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxYm1uZ2huZXltc3B3c2Fpbmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxOTc2MzIsImV4cCI6MjA5OTc3MzYzMn0.8cVY0nH5CAv5ETBGUfjI8tgfqL12IcT2fDJwjZqAZVo';

export const supabaseConfigured =
  !SUPABASE_URL.includes('YOUR-PROJECT-REF') && !SUPABASE_ANON_KEY.includes('YOUR-ANON');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
