'use client';

import { createBrowserClient } from '@supabase/ssr';

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = envUrl.startsWith('http') ? envUrl : 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
