import { Router } from 'express';
import { getDb } from '../db';

const router = Router();

const getBaseUrl = () => {
  return process.env.CASHFREE_ENV === 'PRODUCTION' 
    ? 'https://api.cashfree.com/verification/offline-aadhaar'
    : 'https://sandbox.cashfree.com/verification/offline-aadhaar';
};

const getHeaders = () => {
  return {
    'x-client-id': process.env.CASHFREE_CLIENT_ID || '',
    'x-client-secret': process.env.CASHFREE_CLIENT_SECRET || '',
    'Content-Type': 'application/json',
  };
};

router.post('/send-otp', async (req, res) => {
  const { aadhaar_number, userId } = req.body;

  if (!aadhaar_number || !userId) {
    return res.status(400).json({ error: 'Aadhaar number and User ID are required' });
  }

  try {
    const response = await fetch(`${getBaseUrl()}/otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ aadhaar_number })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Failed to send OTP' });
    }

    res.json({ ref_id: data.ref_id, message: 'OTP sent successfully' });
  } catch (err: any) {
    console.error('Error sending Aadhaar OTP:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { otp, ref_id, userId } = req.body;

  if (!otp || !ref_id || !userId) {
    return res.status(400).json({ error: 'OTP, Ref ID, and User ID are required' });
  }

  try {
    const response = await fetch(`${getBaseUrl()}/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ otp, ref_id })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Failed to verify OTP' });
    }

    if (data.status === 'VALID' || data.status === 'SUCCESS') {
      const db = getDb();
      await db.run('UPDATE users SET aadhaar_verified = true WHERE id = $1', [userId]);
      return res.json({ message: 'Aadhaar verified successfully', data });
    } else {
      return res.status(400).json({ error: 'Invalid OTP or verification failed' });
    }
  } catch (err: any) {
    console.error('Error verifying Aadhaar OTP:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
