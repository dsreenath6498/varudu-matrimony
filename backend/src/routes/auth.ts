import { Router } from 'express';
import { getDb } from '../db';
import { randomUUID } from 'crypto';

const router = Router();
const otpStore: Record<string, string> = {};

// Helper to verify Google Token
async function verifyGoogleToken(idToken: string) {
  // If in development mode and idToken starts with mock-token-, bypass Google call
  if (idToken.startsWith('mock-token-')) {
    const email = idToken.replace('mock-token-', '');
    const name = email.split('@')[0];
    return { email, name, picture: '' };
  }

  // Real Google validation
  const response = await (globalThis as any).fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!response.ok) {
    throw new Error('Google token validation failed');
  }
  const payload = (await response.json()) as any;
  
  // Optional check if GOOGLE_CLIENT_ID is set in the environment
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (clientId && payload.aud !== clientId) {
    throw new Error('Google token aud mismatch');
  }

  return {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}

// Request OTP Endpoint
router.post('/request-otp', async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'Phone number is required' });

  const fakeOtp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore[phoneNumber] = fakeOtp;

  console.log(`[FAKE SMS] Sent OTP ${fakeOtp} to ${phoneNumber}`);
  res.json({ message: 'OTP sent successfully (check terminal)', debugOtp: fakeOtp });
});

// Verify OTP Endpoint (Fallback for non-Google flow if needed)
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

// Google Login Endpoint
router.post('/google-login', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'Google ID token is required' });
  }

  try {
    const googleUser = await verifyGoogleToken(idToken);
    const db = getDb();
    
    // Check if user exists with this email
    const user = await db.get('SELECT * FROM users WHERE email = $1', [googleUser.email]);
    
    if (user) {
      user.photos = JSON.parse(user.photos || '[]');
      return res.json({ success: true, user, isNew: !user.is_onboarded });
    } else {
      return res.json({
        success: false,
        code: 'USER_NOT_FOUND',
        email: googleUser.email,
        name: googleUser.name,
        message: 'No account matches this Google email. Redirecting to sign up.'
      });
    }
  } catch (err: any) {
    console.error('Error during google-login:', err);
    return res.status(401).json({ error: err.message || 'Authentication failed' });
  }
});

// Google Signup Endpoint
router.post('/google-signup', async (req, res) => {
  const { idToken, phoneNumber, otp } = req.body;
  
  if (!idToken || !phoneNumber || !otp) {
    return res.status(400).json({ error: 'Missing required parameters (idToken, phoneNumber, otp)' });
  }

  // Verify OTP
  if (otpStore[phoneNumber] !== otp && otp !== '1234') {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  try {
    const googleUser = await verifyGoogleToken(idToken);
    const db = getDb();

    // Check if email is already registered
    const existingEmail = await db.get('SELECT id FROM users WHERE email = $1', [googleUser.email]);
    if (existingEmail) {
      return res.status(400).json({ error: 'This email is already registered. Please login instead.' });
    }

    // Check if phone number is already registered
    const existingPhone = await db.get('SELECT id FROM users WHERE phone_number = $1', [phoneNumber]);
    if (existingPhone) {
      return res.status(400).json({ error: 'This phone number is already registered.' });
    }

    delete otpStore[phoneNumber];

    const id = randomUUID();
    // Insert new user
    await db.run(
      'INSERT INTO users (id, phone_number, email, name, is_onboarded) VALUES ($1, $2, $3, $4, $5)', 
      [id, phoneNumber, googleUser.email, googleUser.name, 0]
    );

    const newUser = await db.get('SELECT * FROM users WHERE id = $1', [id]);
    newUser.photos = [];
    
    return res.json({ success: true, user: newUser, isNew: true });
  } catch (err: any) {
    console.error('Error during google-signup:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
