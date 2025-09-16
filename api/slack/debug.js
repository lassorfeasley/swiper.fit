export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const hasWebhook = Boolean(process.env.SLACK_WEBHOOK_URL);
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';
  return res.status(200).json({ ok: true, hasWebhook, env });
}


