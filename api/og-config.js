import { createClient } from '@supabase/supabase-js';

export const TEMPLATE_VERSION = String(process.env.OG_TEMPLATE_VERSION || '2');

export function createSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
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


