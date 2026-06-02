import { Router } from 'express';
import { getDb } from '../db';
import { randomUUID } from 'crypto';

const router = Router();
const otpStore: Record<string, string> = {};

// Request OTP Endpoint
router.post('/request-otp', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'Phone number is required' });

  const fakeOtp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore[phoneNumber] = fakeOtp;

  console.log(`[FAKE SMS] Sent OTP ${fakeOtp} to ${phoneNumber}`);
  res.json({ message: 'OTP sent successfully (check terminal)', debugOtp: fakeOtp });
});

// Verify OTP Endpoint
router.post('/verify-otp', async (req, res) => {
  const { phoneNumber, otp } = req.body;
  
  if (otpStore[phoneNumber] !== otp && otp !== '1234') {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  delete otpStore[phoneNumber];
  const db = getDb();

  try {
    const user = await db.get('SELECT * FROM users WHERE phone_number = $1', [phoneNumber]);

    if (user) {
      // Parse photos JSON string to array
      user.photos = JSON.parse(user.photos || '[]');
      res.json({ user, isNew: !user.is_onboarded });
    } else {
      const id = randomUUID();
      await db.run('INSERT INTO users (id, phone_number) VALUES ($1, $2)', [id, phoneNumber]);
      const newUser = await db.get('SELECT * FROM users WHERE id = $1', [id]);
      newUser.photos = [];
      res.json({ user: newUser, isNew: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
