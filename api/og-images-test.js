export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    success: true,
    message: 'OG images endpoint working',
    query: req.query
  });
}
