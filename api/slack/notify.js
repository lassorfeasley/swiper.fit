import { notifySlack } from '../../server/slack/index.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.INTERNAL_API_SECRET;
  if (secret && req.headers['x-internal-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const body = req.body || {};
    const { event, context, data, text, blocks } = body;

    if (!event && !text && !blocks) {
      return res.status(400).json({ error: 'Provide event or (text/blocks)' });
    }

    if (event) {
      await notifySlack(event, context, data);
    } else {
      // Raw pass-through for simple messages without a formatter
      await notifySlack('raw', context, { text, blocks });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Slack notify error', err);
    return res.status(500).json({ error: 'Unexpected error', details: err?.message });
  }
}


