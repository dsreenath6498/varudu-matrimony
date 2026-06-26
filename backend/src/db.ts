import { Pool } from 'pg';

let pool: Pool | null = null;

export async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn("WARNING: DATABASE_URL is not set. Database will not connect.");
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
  });

  try {
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phone_number TEXT UNIQUE NOT NULL,
        name TEXT,
        age INTEGER,
        dob TEXT,
        place TEXT,
        gender TEXT CHECK (gender IN ('Male', 'Female')),
        interested_in TEXT CHECK (interested_in IN ('Male', 'Female')),
        photos TEXT DEFAULT '[]',
        is_onboarded INTEGER DEFAULT 0,
        aadhaar_verified BOOLEAN DEFAULT false,
        face_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        roses_balance INTEGER DEFAULT 0,
        referral_code TEXT UNIQUE,
        referred_by TEXT,
        last_free_rose_at TIMESTAMP,
        family_details TEXT DEFAULT '{}',
        email TEXT UNIQUE
      );

      CREATE TABLE IF NOT EXISTS interests (

        id TEXT PRIMARY KEY,
        sender_id TEXT,
        receiver_id TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        interaction_type TEXT DEFAULT 'standard',
        attached_message TEXT,
        sender_unlocked INTEGER DEFAULT 0,
        receiver_unlocked INTEGER DEFAULT 0,
        is_refunded INTEGER DEFAULT 0,
        accepted_at TIMESTAMP,
        UNIQUE(sender_id, receiver_id)
      );

      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        sender_id TEXT,
        receiver_id TEXT,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rose_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        amount INTEGER,
        transaction_type TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('PostgreSQL Database initialized!');

    // Migration for adding family_details column
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS family_details TEXT DEFAULT '{}';`);
      console.log('Successfully added family_details column to users table (or it already existed).');
    } catch (migErr) {
      console.error('Migration error for family_details:', migErr);
    }

    // Migration for adding email column
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;`);
      console.log('Successfully added email column to users table (or it already existed).');
    } catch (migErr) {
      console.error('Migration error for email:', migErr);
    }

    // Migration for adding face_verified column
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT false;`);
      console.log('Successfully added face_verified column to users table (or it already existed).');
    } catch (migErr) {
      console.error('Migration error for face_verified:', migErr);
    }
  } catch (error) {
    console.error('Error initializing PostgreSQL database:', error);
  }
}

export function getDb() {
  if (!pool) throw new Error("Database not initialized");

  // Wrap pg pool queries to simulate SQLite's api to minimize refactoring
  return {
    get: async (sql: string, params: any[] = []) => {
      const res = await pool!.query(sql, params);
      return res.rows[0];
    },
    all: async (sql: string, params: any[] = []) => {
      const res = await pool!.query(sql, params);
      return res.rows;
    },
    run: async (sql: string, params: any[] = []) => {
      await pool!.query(sql, params);
    }
  };
}
