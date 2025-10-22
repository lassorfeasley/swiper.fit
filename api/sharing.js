export default function handler(req, res) {
  return res
    .status(404)
    .json({ error: "Not an HTTP endpoint. Import from '@/lib/sharingApi' on the client." });
}
