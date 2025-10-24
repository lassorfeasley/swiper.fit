export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({ 
    message: 'OG images test endpoint working',
    timestamp: new Date().toISOString(),
    query: req.query 
  });
}
