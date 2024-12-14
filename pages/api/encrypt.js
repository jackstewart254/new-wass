import { publicEncrypt, constants } from 'crypto';
require('dotenv').config();

export default function handler(req, res) {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'No data provided for encryption.' });
    }

    const publicKey = process.env.PU_KEY.replace(/\\n/g, '\n');

    try {
      const encryptedData = publicEncrypt(
        {
          key: publicKey,
          padding: constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.from(data)
      );

      res.status(200).json({ encryptedData: encryptedData.toString('base64') });
    } catch (error) {
      res.status(500).json({ error: 'Failed to encrypt data.' });
    }
}
