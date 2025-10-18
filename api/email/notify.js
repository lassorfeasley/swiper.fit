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
    console.log('Email API: Unauthorized request - missing or invalid secret');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('Email API: RESEND_API_KEY not configured');
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  const defaultFrom = process.env.EMAIL_FROM || 'Swiper <no-reply@swiper.fit>';

  try {
    const body = req.body || {};
    const { to, subject, html, event, context = {}, data = {} } = body;

    console.log('Email API: Received request', { 
      to, 
      event, 
      hasSubject: !!subject, 
      hasHtml: !!html, 
      context: context.source || 'unknown' 
    });

    if (!to || (Array.isArray(to) && to.length === 0)) {
      console.error('Email API: Missing recipient');
      return res.status(400).json({ error: 'Missing "to" recipient' });
    }

    let finalSubject = subject;
    let finalHtml = html;
    if ((!subject || !html) && event) {
      console.log('Email API: Rendering email template for event:', event);
      const built = renderEmail(event, data, context);
      if (!built) {
        console.error('Email API: Failed to render email template for event:', event);
        return res.status(400).json({ error: `Unknown or unsupported event: ${event}` });
      }
      finalSubject = built.subject;
      finalHtml = built.html;
      console.log('Email API: Template rendered successfully', { 
        subjectLength: finalSubject?.length, 
        htmlLength: finalHtml?.length 
      });
    }

    if (!finalSubject || !finalHtml) {
      console.error('Email API: Missing subject or HTML content');
      return res.status(400).json({ error: 'Provide subject and html, or an event to build them' });
    }

    console.log('Email API: Sending email via Resend', { 
      to, 
      from: defaultFrom, 
      subjectLength: finalSubject.length 
    });

    const resend = new Resend(apiKey);
    const sendResult = await resend.emails.send({
      from: defaultFrom,
      to: Array.isArray(to) ? to : [to],
      subject: finalSubject,
      html: finalHtml,
    });

    if (sendResult?.error) {
      console.error('Email API: Resend error', sendResult.error);
      return res.status(502).json({ error: 'Resend error', details: sendResult.error?.message || String(sendResult.error) });
    }

    console.log('Email API: Email sent successfully', { 
      id: sendResult?.data?.id, 
      to, 
      event 
    });

    return res.status(200).json({ ok: true, id: sendResult?.data?.id || null });
  } catch (err) {
    console.error('Email API: Unexpected error', err);
    return res.status(500).json({ error: 'Unexpected error', details: err?.message });
  }
}

// note: event-based templates rendered via server/email/render.js


