export default async function handler(req, res) {
  try {
    const hasFetch = typeof fetch === 'function';
    const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';
    return res.status(200).json({ ok: true, hasFetch, env });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message });
  }
}


