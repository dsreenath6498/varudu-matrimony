import { Router } from 'express';
import { getDb } from '../db';

const router = Router();

// Get historical messages between two users
router.get('/history', async (req, res) => {
  const { userId1, userId2 } = req.query;
  if (!userId1 || !userId2) return res.status(400).json({ error: 'Missing user IDs' });

  const db = getDb();
  try {
    const messages = await db.all(`
      SELECT * FROM chats 
      WHERE (sender_id = $1 AND receiver_id = $2) 
         OR (sender_id = $3 AND receiver_id = $4)
      ORDER BY created_at ASC
    `, [userId1, userId2, userId2, userId1]);

    res.json({ messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get accepted matches for the chat list
router.get('/matches', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  const db = getDb();
  try {
    // Find all interests where status is 'accepted' involving the user
    const data = await db.all(`
      SELECT i.id as match_id, i.sender_id, i.receiver_id, i.sender_unlocked, i.receiver_unlocked, u.id as u_id, u.name, u.photos
      FROM interests i
      JOIN users u ON (u.id = i.sender_id OR u.id = i.receiver_id)
      WHERE (i.sender_id = $1 OR i.receiver_id = $2) 
        AND i.status = 'accepted' 
        AND u.id != $3
    `, [userId, userId, userId]);

    const matches = data.map(row => {
      // Determine if the current user has unlocked
      const iAmSender = row.sender_id === userId;
      const myUnlockStatus = iAmSender ? row.sender_unlocked : row.receiver_unlocked;
      const theirUnlockStatus = iAmSender ? row.receiver_unlocked : row.sender_unlocked;

      return {
        matchId: row.match_id, // unique room ID based on the interest ID
        myUnlockStatus: myUnlockStatus === 1,
        theirUnlockStatus: theirUnlockStatus === 1,
        isFullyUnlocked: myUnlockStatus === 1 && theirUnlockStatus === 1,
        user: {
          id: row.u_id,
          name: row.name,
          photos: JSON.parse(row.photos || '[]')
        }
      };
    });

    res.json({ matches });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
