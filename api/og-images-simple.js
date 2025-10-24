export default async function handler(req, res) {
  const { type, workoutId, routineId, userId } = req.query;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  res.setHeader('Content-Type', 'application/json');
  
  return res.status(200).json({
    success: true,
    type,
    workoutId,
    routineId,
    userId,
    message: 'OG images endpoint working - simplified version'
  });
}
