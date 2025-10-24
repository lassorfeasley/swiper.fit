export default async function handler(req, res) {
  const { workoutId } = req.query;
  
  if (!workoutId) {
    return res.status(400).send('Missing workoutId');
  }
  
  // Redirect to the correct og-images endpoint
  return res.redirect(302, `/api/og-images?type=workout&workoutId=${workoutId}`);
}
