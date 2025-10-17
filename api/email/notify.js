import { Resend } from 'resend';
import { renderEmail } from '../../server/email/render.js';

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
      const built = renderEmail(event, data, context);
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

// note: event-based templates rendered via server/email/render.js


