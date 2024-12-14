import { parse } from 'cookie';

export default function handler(req, res) {
  const cookies = parse(req.headers.cookie || '');

  const accessToken = cookies.accessToken || null;

  res.status(200).json({ accessToken });
}