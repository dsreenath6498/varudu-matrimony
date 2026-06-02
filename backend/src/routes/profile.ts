import { Router } from 'express';
import { getDb } from '../db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, ''));
  }
});
const upload = multer({ storage });

// 1. Create/Update Profile (Onboarding)
router.post('/create', upload.array('photos', 5), async (req, res) => {
  try {
    const { userId, name, age, dob, place, gender, interested_in, referred_by } = req.body;
    
    if (!userId) return res.status(400).json({ error: 'User ID is required' });
    if (parseInt(age) < 18) return res.status(400).json({ error: 'You must be at least 18 years old to join.' });

    const files = req.files as Express.Multer.File[];
    let photoUrls: string[] = [];

    const db = getDb();
    const existingUser = await db.get('SELECT photos, referral_code, is_onboarded FROM users WHERE id = $1', [userId]);

    if (files && files.length > 0) {
      // Convert to full URL accessible via browser
      const baseUrl = req.protocol + '://' + req.get('host');
      photoUrls = files.map(file => `${baseUrl}/uploads/${file.filename}`);
    } else if (existingUser) {
      photoUrls = JSON.parse(existingUser.photos || '[]');
    }

    // Generate unique referral code if not exists
    let referralCode = existingUser?.referral_code;
    if (!referralCode) {
      referralCode = 'VARUDU-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Handle Referral Logic (only if this is their first time onboarding)
    let extraRoses = 0;
    let finalReferredBy = null;
    let referrerNameForLog = null;
    
    if (!existingUser?.is_onboarded && referred_by) {
      const referrer = await db.get('SELECT id, name, roses_balance FROM users WHERE referral_code = $1', [referred_by.trim()]);
      if (referrer && referrer.id !== userId) {
        // Valid referral code!
        finalReferredBy = referred_by.trim();
        extraRoses = 1; // Give new user 1 rose
        // Give referrer 2 roses
        await db.run('UPDATE users SET roses_balance = COALESCE(roses_balance, 0) + 2 WHERE id = $1', [referrer.id]);

        // Log transaction for referrer
        const crypto = require('crypto');
        await db.run(
          "INSERT INTO rose_transactions (id, user_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)",
          [crypto.randomUUID(), referrer.id, 2, 'referral', `Referral bonus from ${name}`]
        );

        // Prepare description for new user (will be logged after they are inserted)
        referrerNameForLog = referrer.name || 'a friend';
      }
    }

    await db.run(`
      UPDATE users 
      SET name = $1, age = $2, dob = $3, place = $4, gender = $5, interested_in = $6, photos = $7, is_onboarded = 1, referral_code = $8, referred_by = COALESCE(referred_by, $9), roses_balance = COALESCE(roses_balance, 0) + $10
      WHERE id = $11
    `, [name, parseInt(age), dob, place, gender, interested_in, JSON.stringify(photoUrls), referralCode, finalReferredBy, extraRoses, userId]);

    if (extraRoses > 0 && referrerNameForLog) {
      const crypto = require('crypto');
      await db.run(
        "INSERT INTO rose_transactions (id, user_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)",
        [crypto.randomUUID(), userId, extraRoses, 'referral', `Welcome bonus from ${referrerNameForLog}`]
      );
    }

    const updatedUser = await db.get('SELECT * FROM users WHERE id = $1', [userId]);
    updatedUser.photos = JSON.parse(updatedUser.photos || '[]');

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err: any) {
    console.error('Error creating profile:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Fetch Feed (Profiles matching my interest)
router.get('/feed', async (req, res) => {
  const { userId, interestedIn } = req.query;
  if (!userId || !interestedIn) return res.status(400).json({ error: 'Missing userId or interestedIn' });

  const db = getDb();

  try {
    const swipedRecords = await db.all('SELECT receiver_id FROM interests WHERE sender_id = $1', [userId]);
    const swipedIds = swipedRecords.map(s => `'${s.receiver_id}'`);
    swipedIds.push(`'${userId}'`);

    const query = `
      SELECT * FROM users 
      WHERE gender = $1 AND is_onboarded = 1 AND id NOT IN (${swipedIds.join(',')})
      ORDER BY created_at DESC
      LIMIT 20
    `;
    
    const profiles = await db.all(query, [interestedIn]);
    profiles.forEach(p => p.photos = JSON.parse(p.photos || '[]'));

    res.json({ profiles });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
