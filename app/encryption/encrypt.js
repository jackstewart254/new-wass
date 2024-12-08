import CryptoJS from 'crypto-js';

const encryptText = (text) => {
  const SECRET_KEY = process.env.NEXT_PUBLIC_SECRET_KEY
  console.log(SECRET_KEY)
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

export {encryptText}
