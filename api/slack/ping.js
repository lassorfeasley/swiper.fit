import { notifySlack } from '../../server/slack/index.js';

export default async function handler(req, res) {
  try {
    await notifySlack('raw', { env: process.env.VERCEL_ENV || 'production' }, { text: 'Ping from API ✅' });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Slack ping error', err);
    return res.status(500).json({ ok: false, error: err?.message });
  }
}


