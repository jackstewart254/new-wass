import { parse } from 'cookie';

export default function handler(req, res) {
  const cookies = parse(req.headers.cookie || '');

  const admin = cookies.admin || null;

  res.status(200).json({ admin });
}
