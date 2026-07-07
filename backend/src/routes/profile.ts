import { Router } from 'express';
import { getDb } from '../db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';

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
    const { userId, name, age, dob, place, gender, interested_in, referred_by, phoneVisible } = req.body;
    
    if (!userId) return res.status(400).json({ error: 'User ID is required' });
    if (parseInt(age) < 18) return res.status(400).json({ error: 'You must be at least 18 years old to join.' });

    const files = req.files as Express.Multer.File[];
    let photoUrls: string[] = [];

    const db = getDb();
    const existingUser = await db.get('SELECT photos, referral_code, is_onboarded FROM users WHERE id = $1', [userId]);

    if (!existingUser) {
      console.log('Inserting mock user on the fly: ', userId);
      await db.run('INSERT INTO users (id, phone_number) VALUES ($1, $2)', [userId, 'mock-' + userId]);
    }

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
      SET name = $1, age = $2, dob = $3, place = $4, gender = $5, interested_in = $6, photos = $7, is_onboarded = 1, referral_code = $8, referred_by = COALESCE(referred_by, $9), roses_balance = COALESCE(roses_balance, 0) + $10, phone_visible = $11
      WHERE id = $12
    `, [name, parseInt(age), dob, place, gender, interested_in, JSON.stringify(photoUrls), referralCode, finalReferredBy, extraRoses, phoneVisible === true || phoneVisible === 1 || phoneVisible === 'true', userId]);

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
    
    // Fetch user's unlocked target IDs
    const unlocks = await db.all('SELECT unlocked_user_id FROM public.phone_unlocks WHERE unlocker_id = $1', [userId]);
    const unlockedSet = new Set(unlocks.map(u => u.unlocked_user_id));

    profiles.forEach(p => {
      p.photos = JSON.parse(p.photos || '[]');
      p.family_details = JSON.parse(p.family_details || '{}');
      
      const isVisible = p.phone_visible === true || p.phone_visible === 1 || p.phone_visible === 'true';
      p.phone_visible = isVisible;
      
      if (isVisible) {
        if (unlockedSet.has(p.id)) {
          p.phone_unlocked = true;
          // Keep p.phone_number intact
        } else {
          p.phone_unlocked = false;
          p.phone_number = null; // Remove/mask phone number
        }
      } else {
        p.phone_unlocked = false;
        p.phone_number = null; // Remove/mask phone number
      }
    });

    res.json({ profiles });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get My Profile
router.get('/me', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  
  const db = getDb();
  try {
    const user = await db.get('SELECT * FROM users WHERE id = $1', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.photos = JSON.parse(user.photos || '[]');
    user.family_details = JSON.parse(user.family_details || '{}');
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Update Family Details
router.put('/update-family', async (req, res) => {
  const { userId, familyDetails } = req.body;
  if (!userId || !familyDetails) {
    return res.status(400).json({ error: 'Missing userId or familyDetails' });
  }

  const db = getDb();
  try {
    const familyDetailsStr = JSON.stringify(familyDetails);
    await db.run('UPDATE users SET family_details = $1 WHERE id = $2', [familyDetailsStr, userId]);
    res.json({ message: 'Family details updated successfully' });
  } catch (err: any) {
    console.error('Error updating family details:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Upload/Update single profile photo (primary avatar)
router.post('/update-photo', upload.single('photo'), async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });

  const db = getDb();
  try {
    const baseUrl = req.protocol + '://' + req.get('host');
    const photoUrl = `${baseUrl}/uploads/${req.file.filename}`;

    // Read existing photos or initialize empty array
    const user = await db.get('SELECT photos FROM users WHERE id = $1', [userId]);
    let photos: string[] = [];
    if (user && user.photos) {
      try {
        photos = JSON.parse(user.photos);
      } catch (e) {}
    }

    // Set as primary photo (at index 0)
    photos[0] = photoUrl;

    await db.run('UPDATE users SET photos = $1 WHERE id = $2', [JSON.stringify(photos), userId]);

    const updatedUser = await db.get('SELECT * FROM users WHERE id = $1', [userId]);
    updatedUser.photos = JSON.parse(updatedUser.photos || '[]');
    updatedUser.family_details = JSON.parse(updatedUser.family_details || '{}');

    res.json({ message: 'Photo uploaded successfully', user: updatedUser });
  } catch (error: any) {
    console.error('Error updating photo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper to convert profile picture (URL or local path) to base64 string
async function getImageBase64(imageUrl: string): Promise<string> {
  // If it's a local upload, read directly from file system
  if (imageUrl.includes('/uploads/')) {
    try {
      const filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
      const filePath = path.join(__dirname, '../../uploads', filename);
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath).toString('base64');
      }
    } catch (e) {
      console.warn('Failed to read local file, falling back to fetch:', e);
    }
  }

  // Fallback: fetch via HTTP
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  return Buffer.from(response.data, 'binary').toString('base64');
}

// POST /verify-face - compare live webcam selfie with profile picture using Gemini
router.post('/verify-face', async (req, res) => {
  const { userId, selfieDataUrl } = req.body;

  if (!userId || !selfieDataUrl) {
    return res.status(400).json({ error: 'Missing userId or selfieDataUrl' });
  }

  const db = getDb();

  try {
    // 1. Get user profile and parse their photos
    const user = await db.get('SELECT photos FROM users WHERE id = $1', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const photos = JSON.parse(user.photos || '[]');
    if (!photos || photos.length === 0) {
      return res.status(400).json({ error: 'Please upload a profile photo before doing face verification.' });
    }

    const primaryPhotoUrl = photos[0];
    console.log('Verifying user face. Primary photo URL:', primaryPhotoUrl);

    // 2. Convert profile photo and selfie to base64
    let base64Profile: string;
    try {
      base64Profile = await getImageBase64(primaryPhotoUrl);
    } catch (e: any) {
      console.error('Error reading profile photo:', e);
      return res.status(500).json({ error: 'Failed to retrieve your profile picture. Please make sure it is uploaded.' });
    }

    const base64Selfie = selfieDataUrl.replace(/^data:image\/\w+;base64,/, '');

    // 3. Initialize Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not configured in backend env.');
      return res.status(500).json({ error: 'AI Verification service is currently unavailable. Please contact support.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 4. Send to Gemini
    const prompt = 'Analyze these two images. Image 1 is a registered profile picture, and Image 2 is a webcam live selfie. ' +
      'Determine if they show the same person. Answer strictly in JSON matching the schema: {"matched": boolean, "confidence": number, "reasoning": string}. ' +
      'Ignore differences in lighting, camera quality, small age changes, or expressions. Return matched true if they are the same person with high likelihood (above 70% confidence).';

    console.log('Sending images to Gemini for comparison...');
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Profile
              }
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Selfie
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const replyText = result.text || '';
    console.log('Gemini raw response:', replyText);

    const matchData = JSON.parse(replyText.trim());

    // 5. If matched, update the database
    if (matchData.matched && matchData.confidence >= 0.7) {
      await db.run('UPDATE users SET face_verified = true WHERE id = $1', [userId]);
      return res.json({
        success: true,
        matched: true,
        confidence: matchData.confidence,
        reasoning: matchData.reasoning,
        message: 'Face verification successful! You have been awarded the verification badge.'
      });
    } else {
      return res.json({
        success: false,
        matched: false,
        confidence: matchData.confidence,
        reasoning: matchData.reasoning,
        message: 'Face verification failed. Please ensure your face is well lit, clearly visible, and matches your profile photo.'
      });
    }

  } catch (error: any) {
    console.error('Error during face verification:', error);
    return res.status(500).json({ error: error.message || 'An error occurred during verification' });
  }
});

// 9. Unlock Phone Number
router.post('/unlock-phone', async (req, res) => {
  const { userId, targetUserId } = req.body;
  if (!userId || !targetUserId) {
    return res.status(400).json({ error: 'Missing userId or targetUserId' });
  }

  const db = getDb();
  try {
    // 1. Fetch target user
    const targetUser = await db.get('SELECT * FROM users WHERE id = $1', [targetUserId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // 2. Check if target user has phone visibility enabled
    if (!targetUser.phone_visible) {
      return res.status(400).json({ error: 'This user has not shared their phone number.' });
    }

    // 3. Check if already unlocked
    const existingUnlock = await db.get(
      'SELECT 1 FROM public.phone_unlocks WHERE unlocker_id = $1 AND unlocked_user_id = $2',
      [userId, targetUserId]
    );
    if (existingUnlock) {
      return res.json({ success: true, phoneNumber: targetUser.phone_number });
    }

    // 4. Fetch current user balance
    const currentUser = await db.get('SELECT roses_balance FROM users WHERE id = $1', [userId]);
    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    const cost = 5; // Costs 5 Roses
    if ((currentUser.roses_balance || 0) < cost) {
      return res.status(400).json({ error: 'Insufficient Roses. Unlock costs 5 Roses. Please purchase more from the Boutique.' });
    }

    // 5. Deduct roses
    await db.run(
      'UPDATE users SET roses_balance = roses_balance - $1 WHERE id = $2',
      [cost, userId]
    );

    // 6. Record transaction
    const { randomUUID } = require('crypto');
    const txId = randomUUID();
    await db.run(
      'INSERT INTO rose_transactions (id, user_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)',
      [txId, userId, -cost, 'unlock_phone', `Unlocked phone number of ${targetUser.name || 'User'}`]
    );

    // 7. Record unlock
    const unlockId = randomUUID();
    await db.run(
      'INSERT INTO public.phone_unlocks (id, unlocker_id, unlocked_user_id) VALUES ($1, $2, $3)',
      [unlockId, userId, targetUserId]
    );

    return res.json({ success: true, phoneNumber: targetUser.phone_number });
  } catch (err: any) {
    console.error('Error unlocking phone:', err);
    res.status(500).json({ error: err.message });
  }
});

// 10. Toggle Phone Privacy
router.put('/toggle-phone-privacy', async (req, res) => {
  const { userId, phoneVisible } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  const db = getDb();
  try {
    const isVisible = phoneVisible === true || phoneVisible === 1 || phoneVisible === 'true';
    await db.run('UPDATE users SET phone_visible = $1 WHERE id = $2', [isVisible, userId]);
    const updatedUser = await db.get('SELECT * FROM users WHERE id = $1', [userId]);
    updatedUser.photos = JSON.parse(updatedUser.photos || '[]');
    updatedUser.family_details = JSON.parse(updatedUser.family_details || '{}');
    
    return res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    console.error('Error toggling phone privacy:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
