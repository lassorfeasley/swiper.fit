export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    success: true,
    message: 'New endpoint working',
    timestamp: new Date().toISOString()
  });
}
