import { Router } from 'express';
import { getDb } from '../db';
import { randomUUID, createHmac } from 'crypto';
import Razorpay from 'razorpay';

let razorpay: any = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

const router = Router();

// Get Rose Balance
router.get('/balance', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  const db = getDb();
  try {
    const user = await db.get('SELECT roses_balance, last_free_rose_at, referral_code FROM users WHERE id = $1', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Check if 48 hours have passed
    let canClaimFree = false;
    if (!user.last_free_rose_at) {
      canClaimFree = true;
    } else {
      const lastClaim = new Date(user.last_free_rose_at).getTime();
      const now = new Date().getTime();
      const hours48 = 48 * 60 * 60 * 1000;
      if (now - lastClaim >= hours48) {
        canClaimFree = true;
      }
    }

    res.json({
      roses_balance: user.roses_balance || 0,
      referral_code: user.referral_code,
      can_claim_free: canClaimFree,
      last_free_rose_at: user.last_free_rose_at
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Claim Free 48-Hour Rose
router.post('/claim-free', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  const db = getDb();
  try {
    const user = await db.get('SELECT last_free_rose_at FROM users WHERE id = $1', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let canClaim = false;
    if (!user.last_free_rose_at) {
      canClaim = true;
    } else {
      const lastClaim = new Date(user.last_free_rose_at).getTime();
      const now = new Date().getTime();
      const hours48 = 48 * 60 * 60 * 1000;
      if (now - lastClaim >= hours48) canClaim = true;
    }

    if (!canClaim) return res.status(400).json({ error: 'Must wait 48 hours between free roses.' });

    await db.run('UPDATE users SET roses_balance = COALESCE(roses_balance, 0) + 1, last_free_rose_at = CURRENT_TIMESTAMP WHERE id = $1', [userId]);
    
    // Log Transaction
    const txId = randomUUID();
    await db.run(
      "INSERT INTO rose_transactions (id, user_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)",
      [txId, userId, 1, 'daily', 'Claimed Daily Free Rose']
    );

    res.json({ message: 'Claimed 1 free rose!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Watch Ad to Earn Rose
router.post('/watch-ad', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  const db = getDb();
  try {
    // In a real app, verify the ad was completely watched via a secure token from ad provider
    await db.run('UPDATE users SET roses_balance = COALESCE(roses_balance, 0) + 1 WHERE id = $1', [userId]);
    
    // Log Transaction
    const txId = randomUUID();
    await db.run(
      "INSERT INTO rose_transactions (id, user_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)",
      [txId, userId, 1, 'ad', 'Watched an Ad']
    );

    res.json({ message: 'Ad completed. 1 Rose added!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create Razorpay Order
router.post('/buy-order', async (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || !amount) return res.status(400).json({ error: 'Missing parameters' });

  // Prices: 1 Rose = ₹100, 5 Roses = ₹350, 20 Roses = ₹1150
  // Convert INR to Paise (multiply by 100)
  let inrPrice = 100;
  if (amount === 5) inrPrice = 350;
  if (amount === 20) inrPrice = 1150;

  try {
    if (razorpay) {
      const options = {
        amount: inrPrice * 100, // paise
        currency: "INR",
        receipt: `receipt_${randomUUID().substring(0, 8)}`
      };
      const order = await razorpay.orders.create(options);
      res.json({ orderId: order.id, amount: options.amount, keyId: process.env.RAZORPAY_KEY_ID });
    } else {
      // Mock mode if no keys
      res.json({ orderId: `mock_order_${randomUUID().substring(0, 8)}`, amount: inrPrice * 100, mock: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Verify Razorpay Payment and Add Roses
router.post('/buy-verify', async (req, res) => {
  const { userId, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature, mock } = req.body;
  
  if (!userId || !amount) return res.status(400).json({ error: 'Missing parameters' });

  // Verify signature if not in mock mode
  if (!mock && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
                                .update(body.toString())
                                .digest('hex');
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }
  }

  const db = getDb();
  try {
    await db.run('UPDATE users SET roses_balance = COALESCE(roses_balance, 0) + $1 WHERE id = $2', [amount, userId]);
    
    // Log Transaction
    const txId = randomUUID();
    await db.run(
      "INSERT INTO rose_transactions (id, user_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)",
      [txId, userId, amount, 'purchase', 'Purchased Roses']
    );

    res.json({ message: `Successfully purchased ${amount} roses!` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get Transaction History
router.get('/history', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  const db = getDb();
  try {
    const transactions = await db.all(
      "SELECT * FROM rose_transactions WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json({ transactions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
