import { createClient } from '@supabase/supabase-js';

export const TEMPLATE_VERSION = String(process.env.OG_TEMPLATE_VERSION || '2');

const DEFAULT_SUPABASE_URL = 'https://tdevpmxmvrgouozsgplu.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXZwbXhtdnJnb3VvenNncGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODc0MTksImV4cCI6MjA2MzI2MzQxOX0.XjatUG82rA1rQDIvAfvlJ815xJaAjj2GZJG7mfrdxl0';

export function createSupabaseServerClient() {
  const url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export function getApiBase(req) {
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  const origin = (req?.headers?.host && (req.headers['x-forwarded-proto'] || 'https'))
    ? `${req.headers['x-forwarded-proto']}://${req.headers.host}`
    : null;
  const localDev = !vercelUrl && origin && origin.includes('localhost');
  return localDev ? 'http://localhost:3004' : (vercelUrl || origin || 'https://www.swiper.fit');
}


