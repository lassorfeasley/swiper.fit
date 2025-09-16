export default async function handler(req, res) {
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
      const env = context.env || process.env.VERCEL_ENV || 'production';
      const requestId = context.request_id || context.correlation_id || '';
      const common = [`env: \`${env}\``, requestId ? `req: \`${requestId}\`` : null].filter(Boolean).join(' • ');
      payload = {
        text: `${event} (${env})`,
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: `🔔 ${event}`, emoji: true } },
          { type: 'section', text: { type: 'mrkdwn', text: '```\n' + JSON.stringify({ context, data }, null, 2) + '\n```' } },
          { type: 'context', elements: [{ type: 'mrkdwn', text: common }] },
        ],
      };
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

