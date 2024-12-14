import { serialize } from 'cookie';

export default function handler(req, res) {
  const { method, value } = req.body;
  const cookies = [];

  if (method === "access") {
    const accessCookie = serialize('accessToken', value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      // maxAge: 0
    });

    cookies.push(accessCookie);
  }

  if (method === "admin") {
    const adminCookie = serialize('admin', value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    });

    cookies.push(adminCookie);
  }

  if (cookies.length > 0) {
    res.setHeader('Set-Cookie', cookies); // Set all cookies at once
  }

  res.status(200).json({ message: 'Cookies set successfully' });
}
