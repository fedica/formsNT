/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://olviytxdvhkcayojqyqm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdml5dHhkdmhrY2F5b2pxeXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzOTc2NDAsImV4cCI6MjA4ODk3MzY0MH0.VGIVpEnO3-4L87W7Rt9a1DtN9gS9V1t-kf34W0y2kpk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
