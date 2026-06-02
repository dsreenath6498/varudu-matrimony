import { Router } from 'express';
import { getDb } from '../db';
import { randomUUID } from 'crypto';

const router = Router();

// 1. Swipe action
router.post('/swipe', async (req, res) => {
  const { senderId, receiverId, isInterested, interactionType = 'standard', attachedMessage = null } = req.body;
  if (!senderId || !receiverId) return res.status(400).json({ error: 'Sender and Receiver IDs required' });

  const status = isInterested ? 'pending' : 'rejected';
  const db = getDb();

  try {
    // Check Rose Balance if trying to use premium features
    if (isInterested && interactionType !== 'standard') {
      const user = await db.get('SELECT roses_balance FROM users WHERE id = $1', [senderId]);
      const cost = interactionType === 'rose_message' ? 3 : 1;

      if ((user.roses_balance || 0) < cost) {
        return res.status(400).json({ error: 'Insufficient Roses' });
      }

      // Fetch receiver name for log
      const receiver = await db.get('SELECT name FROM users WHERE id = $1', [receiverId]);
      const receiverName = receiver?.name || 'a user';

      // Deduct roses
      await db.run('UPDATE users SET roses_balance = roses_balance - $1 WHERE id = $2', [cost, senderId]);

      // Log transaction
      const txId = randomUUID();
      await db.run(
        "INSERT INTO rose_transactions (id, user_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)",
        [txId, senderId, -cost, 'spent_swipe', `Sent Rose to ${receiverName}`]
      );
    }

    const id = randomUUID();
    await db.run(
      'INSERT INTO interests (id, sender_id, receiver_id, status, interaction_type, attached_message) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (sender_id, receiver_id) DO NOTHING', 
      [id, senderId, receiverId, status, interactionType, attachedMessage]
    );
    res.json({ message: 'Swipe recorded successfully', status });
  } catch (error: any) {
    console.error('Swipe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. My Interests
router.get('/my-interests', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  const db = getDb();
  try {
    const data = await db.all(`
      SELECT i.id, i.status, u.id as u_id, u.name, u.age, u.place, u.photos
      FROM interests i
      JOIN users u ON i.receiver_id = u.id
      WHERE i.sender_id = $1 AND i.status != 'rejected'
    `, [userId]);

    const interests = data.map(row => ({
      id: row.id,
      status: row.status,
      users: {
        id: row.u_id,
        name: row.name,
        age: row.age,
        place: row.place,
        photos: JSON.parse(row.photos || '[]')
      }
    }));

    res.json({ interests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Requests
router.get('/requests', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  const db = getDb();
  try {
    const data = await db.all(`
      SELECT i.id, i.status, i.interaction_type, i.attached_message, u.id as u_id, u.name, u.age, u.place, u.photos
      FROM interests i
      JOIN users u ON i.sender_id = u.id
      WHERE i.receiver_id = $1 AND i.status = 'pending'
      ORDER BY 
        CASE 
          WHEN i.interaction_type = 'rose_message' THEN 1
          WHEN i.interaction_type = 'rose' THEN 2
          ELSE 3
        END, i.created_at DESC
    `, [userId]);

    const requests = data.map(row => ({
      id: row.id,
      status: row.status,
      interaction_type: row.interaction_type,
      attached_message: row.attached_message,
      users: {
        id: row.u_id,
        name: row.name,
        age: row.age,
        place: row.place,
        photos: JSON.parse(row.photos || '[]')
      }
    }));

    res.json({ requests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Accept Request
router.post('/accept', async (req, res) => {
  const { interestId } = req.body;
  if (!interestId) return res.status(400).json({ error: 'Interest ID required' });

  const db = getDb();
  try {
    const interest = await db.get('SELECT * FROM interests WHERE id = $1', [interestId]);
    if (!interest) return res.status(404).json({ error: 'Interest not found' });

    // If it's a premium interaction (Rose), both users are instantly unlocked
    let senderUnlocked = 0;
    let receiverUnlocked = 0;
    
    if (interest.interaction_type === 'rose' || interest.interaction_type === 'rose_message') {
      senderUnlocked = 1;
      receiverUnlocked = 1;
    }

    await db.run(
      "UPDATE interests SET status = 'accepted', sender_unlocked = $1, receiver_unlocked = $2, accepted_at = CURRENT_TIMESTAMP WHERE id = $3", 
      [senderUnlocked, receiverUnlocked, interestId]
    );

    res.json({ message: 'Request accepted!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Unlock Chat (Standard Requests)
router.post('/unlock-chat', async (req, res) => {
  const { interestId, userId } = req.body;
  if (!interestId || !userId) return res.status(400).json({ error: 'Missing parameters' });

  const db = getDb();
  try {
    const interest = await db.get('SELECT * FROM interests WHERE id = $1', [interestId]);
    if (!interest) return res.status(404).json({ error: 'Interest not found' });

    // Check user's rose balance
    const user = await db.get('SELECT roses_balance FROM users WHERE id = $1', [userId]);
    if ((user.roses_balance || 0) < 1) return res.status(400).json({ error: 'Insufficient Roses' });

    // Deduct 1 Rose
    await db.run('UPDATE users SET roses_balance = roses_balance - 1 WHERE id = $1', [userId]);

    // Fetch match name for log
    const matchId = interest.sender_id === userId ? interest.receiver_id : interest.sender_id;
    const match = await db.get('SELECT name FROM users WHERE id = $1', [matchId]);
    const matchName = match?.name || 'a match';

    // Log transaction
    const crypto = require('crypto');
    await db.run(
      "INSERT INTO rose_transactions (id, user_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)",
      [crypto.randomUUID(), userId, -1, 'spent_chat', `Unlocked chat with ${matchName}`]
    );

    // Update the unlock status
    if (interest.sender_id === userId) {
      await db.run('UPDATE interests SET sender_unlocked = 1 WHERE id = $1', [interestId]);
    } else if (interest.receiver_id === userId) {
      await db.run('UPDATE interests SET receiver_unlocked = 1 WHERE id = $1', [interestId]);
    }

    res.json({ message: 'Successfully unlocked your side of the chat!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
