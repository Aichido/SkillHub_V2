import CryptoJS from 'crypto-js';

export const getSecurityHeaders = (data) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    const nonce = 'front_' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    
    // ✅ On fixe le body en string UNE SEULE FOIS
    const bodyString = JSON.stringify(data);
    const payload = bodyString + nonce + timestamp;
    const secret = import.meta.env.VITE_APP_MASTER_KEY;
    
    const signature = CryptoJS.HmacSHA256(payload, secret).toString(CryptoJS.enc.Hex);

    return {
        headers: {
            'X-Nonce': nonce,
            'X-Timestamp': timestamp,
            'X-HMAC-Signature': signature,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: bodyString
    };
};