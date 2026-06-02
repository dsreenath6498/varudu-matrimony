import { getDb } from './db';

// This function runs the background sweeps for the Rose Economy
export const startCronJobs = () => {
  console.log('Background sweeps initialized...');

  // Run every 10 minutes
  setInterval(async () => {
    const db = getDb();
    try {
      // SCENARIO 1: Refund standard requests where ONE person paid to unlock, but the other didn't within 48 hours
      const abandonedChats = await db.all(`
        SELECT id, sender_id, receiver_id, sender_unlocked, receiver_unlocked 
        FROM interests 
        WHERE status = 'accepted' 
          AND is_refunded = 0
          AND (sender_unlocked + receiver_unlocked) = 1
          AND accepted_at <= NOW() - INTERVAL '48 hours'
      `);

      const crypto = require('crypto');

      for (const chat of abandonedChats) {
        let refundUser = null;
        if (chat.sender_unlocked === 1) {
          refundUser = chat.sender_id;
        } else if (chat.receiver_unlocked === 1) {
          refundUser = chat.receiver_id;
        }

        if (refundUser) {
          await db.run('UPDATE users SET roses_balance = COALESCE(roses_balance, 0) + 1 WHERE id = $1', [refundUser]);
          await db.run("INSERT INTO rose_transactions (id, user_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)", [crypto.randomUUID(), refundUser, 1, 'refund', 'Refunded 1 Rose for abandoned chat']);
        }

        await db.run("UPDATE interests SET is_refunded = 1, status = 'rejected' WHERE id = $1", [chat.id]);
        console.log(`[Refund] Refunded 1 Rose for abandoned chat: ${chat.id}`);
      }

      // SCENARIO 2: Refund premium requests (1 or 3 roses) that were ignored for 7 days
      const ignoredPremium = await db.all(`
        SELECT id, sender_id, interaction_type 
        FROM interests 
        WHERE status = 'pending' 
          AND is_refunded = 0
          AND interaction_type IN ('rose', 'rose_message')
          AND created_at <= NOW() - INTERVAL '7 days'
      `);

      for (const req of ignoredPremium) {
        const refundAmount = req.interaction_type === 'rose_message' ? 3 : 1;
        await db.run('UPDATE users SET roses_balance = COALESCE(roses_balance, 0) + $1 WHERE id = $2', [refundAmount, req.sender_id]);
        await db.run("INSERT INTO rose_transactions (id, user_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)", [crypto.randomUUID(), req.sender_id, refundAmount, 'refund', 'Refunded Rose(s) for ignored request']);
        await db.run("UPDATE interests SET is_refunded = 1, status = 'rejected' WHERE id = $1", [req.id]);
        console.log(`[Refund] Refunded ${refundAmount} Rose(s) for ignored premium request: ${req.id}`);
      }

    } catch (err) {
      console.error('Error running cron sweeps:', err);
    }
  }, 10 * 60 * 1000); // 10 minutes
};
