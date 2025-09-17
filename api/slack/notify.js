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

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'SLACK_WEBHOOK_URL not configured' });
  }

  try {
    const body = req.body || {};
    const { event, context = {}, data = {}, text, blocks } = body;

    let payload;
    if (text || blocks) {
      payload = { text, blocks };
    } else if (event) {
      payload = await buildFriendlyPayload(event, context, data);
    } else {
      return res.status(400).json({ error: 'Provide event or (text/blocks)' });
    }

    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const details = await resp.text();
      return res.status(502).json({ error: 'Slack error', details });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Slack notify error', err);
    return res.status(500).json({ error: 'Unexpected error', details: err?.message });
  }
}

// --- Helpers ---
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tdevpmxmvrgouozsgplu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXZwbXhtdnJnb3VvenNncGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODc0MTksImV4cCI6MjA2MzI2MzQxOX0.XjatUG82rA1rQDIvAfvlJ815xJaAjj2GZJG7mfrdxl0'
);

async function buildFriendlyPayload(event, context, data) {
  const env = context.env || process.env.VERCEL_ENV || 'production';
  const contextLabel = { type: 'context', elements: [{ type: 'mrkdwn', text: `env: \`${env}\`` }] };

  if (event === 'workout.started') {
    const name = data.user_name || (await getUserDisplayName(data.user_id)) || 'Someone';
    const routine = data.routine_name || (await getRoutineName(data.routine_id)) || 'a';
    const line = `${name} started a ${routine} workout.`;
    return { text: line, blocks: [contextLabel, { type: 'section', text: { type: 'mrkdwn', text: line } }] };
  }

  if (event === 'workout.ended') {
    const name = data.user_name || (await getUserDisplayName(data.user_id)) || 'Someone';
    const routine = data.routine_name || (await getRoutineName(data.routine_id)) || 'a';
    const duration = formatDuration(data.duration_sec);
    const sets = typeof data.total_sets === 'number' ? `${data.total_sets} set${data.total_sets === 1 ? '' : 's'}` : '';
    const extras = [duration, sets].filter(Boolean).join(' • ');
    const line = `${name} completed a ${routine} workout${extras ? ` — ${extras}` : ''}.`;
    return { text: line, blocks: [contextLabel, { type: 'section', text: { type: 'mrkdwn', text: line } }] };
  }

  if (event === 'account.created') {
    const name = (await getUserDisplayName(data.user_id)) || data.email || 'New user';
    const line = `🎉 ${name} created an account.`;
    return { text: line, blocks: [contextLabel, { type: 'section', text: { type: 'mrkdwn', text: line } }] };
  }

  if (event === 'routine.created') {
    const name = (await getUserDisplayName(data.user_id)) || 'Someone';
    const routine = data.routine_name || (await getRoutineName(data.routine_id)) || 'a new';
    const line = `📝 ${name} created routine “${routine}”.`;
    return { text: line, blocks: [contextLabel, { type: 'section', text: { type: 'mrkdwn', text: line } }] };
  }

  if (event === 'sharing.connected') {
    const owner = (await getUserDisplayName(data.from_account_id)) || 'Someone';
    const delegate = (await getUserDisplayName(data.to_account_id)) || 'a teammate';
    const line = `🤝 ${owner} shared account access with ${delegate}.`;
    return { text: line, blocks: [contextLabel, { type: 'section', text: { type: 'mrkdwn', text: line } }] };
  }

  // Fallback: structured dump
  return {
    text: `${event} (${env})`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: `🔔 ${event}`, emoji: true } },
      { type: 'section', text: { type: 'mrkdwn', text: '```\n' + JSON.stringify({ context, data }, null, 2) + '\n```' } },
      contextLabel,
    ],
  };
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

