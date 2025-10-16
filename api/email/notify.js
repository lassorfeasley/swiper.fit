import { Resend } from 'resend';
import { getSupabaseServerClient } from '../../server/supabase.js';

// Endpoint to send application emails via Resend.
// Accepts either a raw subject/html or an event to format.
export default async function handler(req, res) {
  // Basic CORS support for local dev calling production API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-internal-secret');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.INTERNAL_API_SECRET;
  if (secret && req.headers['x-internal-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }
  const defaultFrom = process.env.EMAIL_FROM || 'Swiper <no-reply@swiper.fit>';

  try {
    const body = req.body || {};
    const { to, subject, html, event, context = {}, data = {} } = body;

    if (!to || (Array.isArray(to) && to.length === 0)) {
      return res.status(400).json({ error: 'Missing "to" recipient' });
    }

    let finalSubject = subject;
    let finalHtml = html;
    if ((!subject || !html) && event) {
      const built = await buildEmailForEvent(event, context, data);
      if (!built) return res.status(400).json({ error: `Unknown or unsupported event: ${event}` });
      finalSubject = built.subject;
      finalHtml = built.html;
    }

    if (!finalSubject || !finalHtml) {
      return res.status(400).json({ error: 'Provide subject and html, or an event to build them' });
    }

    const resend = new Resend(apiKey);
    const sendResult = await resend.emails.send({
      from: defaultFrom,
      to: Array.isArray(to) ? to : [to],
      subject: finalSubject,
      html: finalHtml,
    });

    if (sendResult?.error) {
      return res.status(502).json({ error: 'Resend error', details: sendResult.error?.message || String(sendResult.error) });
    }

    return res.status(200).json({ ok: true, id: sendResult?.data?.id || null });
  } catch (err) {
    console.error('Email notify error', err);
    return res.status(500).json({ error: 'Unexpected error', details: err?.message });
  }
}

const supabase = getSupabaseServerClient();

async function buildEmailForEvent(event, context, data) {
  const env = context.env || process.env.VERCEL_ENV || 'production';

  if (event === 'workout.completed') {
    const name = data.user_name || (await getUserDisplayName(data.user_id)) || 'Your athlete';
    const routine = data.routine_name || (await getRoutineName(data.routine_id)) || 'a workout';
    const duration = formatDuration(data.duration_sec);
    const sets = typeof data.total_sets === 'number' ? `${data.total_sets} set${data.total_sets === 1 ? '' : 's'}` : '';
    const extras = [duration, sets].filter(Boolean).join(' • ');
    const subject = `${name} completed ${routine}${extras ? ` — ${extras}` : ''}`;
    const html = basicEmailShell({
      title: 'Workout complete',
      preheader: subject,
      body: `<p><strong>${escapeHtml(name)}</strong> completed <strong>${escapeHtml(routine)}</strong>${extras ? ` — ${escapeHtml(extras)}` : ''}.</p>`,
      footer: envFooter(env),
    });
    return { subject, html };
  }

  if (event === 'account.created') {
    const name = (await getUserDisplayName(data.user_id)) || data.email || 'New user';
    const subject = `Welcome to Swiper, ${name}!`;
    const html = basicEmailShell({
      title: 'Welcome to Swiper',
      preheader: 'Your account is ready',
      body: `<p>Hi ${escapeHtml(name)},</p><p>Thanks for joining Swiper. Let’s get your first workout set up.</p>`,
      footer: envFooter(env),
    });
    return { subject, html };
  }

  if (event === 'sharing.connected') {
    const owner = (await getUserDisplayName(data.from_account_id)) || 'Someone';
    const delegate = (await getUserDisplayName(data.to_account_id)) || 'a teammate';
    const subject = `Access granted: ${owner} → ${delegate}`;
    const html = basicEmailShell({
      title: 'Sharing enabled',
      preheader: subject,
      body: `<p>${escapeHtml(owner)} shared account access with ${escapeHtml(delegate)}.</p>`,
      footer: envFooter(env),
    });
    return { subject, html };
  }

  return null;
}

async function getUserDisplayName(userId) {
  try {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return null;
    const first = (data.first_name || '').trim();
    const last = (data.last_name || '').trim();
    const full = `${first} ${last}`.trim();
    return full || data.email || null;
  } catch {
    return null;
  }
}

async function getRoutineName(routineId) {
  try {
    if (!routineId) return null;
    const { data, error } = await supabase
      .from('routines')
      .select('routine_name')
      .eq('id', routineId)
      .maybeSingle();
    if (error || !data) return null;
    return data.routine_name || null;
  } catch {
    return null;
  }
}

function formatDuration(seconds) {
  if (typeof seconds !== 'number' || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m`;
  return `${s}s`;
}

function envFooter(env) {
  return env && env !== 'production' ? `<p style="color:#6b7280;">Environment: ${escapeHtml(env)}</p>` : '';
}

function basicEmailShell({ title, preheader, body, footer }) {
  // Very simple, safe default HTML email shell
  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${escapeHtml(title || 'Notification')}</title>
    <style>body{background:#f8fafc;margin:0;padding:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;color:#0f172a} .container{max-width:560px;margin:0 auto;padding:24px} .card{background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:20px} h1{font-size:18px;margin:0 0 8px 0;color:#111827} p{font-size:14px;line-height:1.6;margin:0 0 12px 0;color:#111827}</style>
  </head>
  <body>
    <span style="display:none;visibility:hidden;opacity:0;height:0;width:0;">${escapeHtml(preheader || '')}</span>
    <div class="container">
      <div class="card">
        <h1>${escapeHtml(title || 'Notification')}</h1>
        ${body || ''}
        ${footer || ''}
      </div>
    </div>
  </body>
</html>`;
}

function escapeHtml(input) {
  return String(input || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


