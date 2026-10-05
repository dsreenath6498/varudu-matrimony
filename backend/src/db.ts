import { Pool } from 'pg';
import path from 'path';

let pool: Pool | null = null;
let sqliteAdapter: {
  get: (sql: string, params?: any[]) => Promise<any>;
  all: (sql: string, params?: any[]) => Promise<any[]>;
  run: (sql: string, params?: any[]) => Promise<void>;
} | null = null;

let isSqlite = false;

export async function initDb() {
  let pgConnected = false;

  if (process.env.DATABASE_URL) {
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL?.includes('sslmode=require') || process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : undefined,
        connectionTimeoutMillis: 10000
      });

      // Test PostgreSQL connection
      await pool.query('SELECT 1');
      pgConnected = true;
      console.log('Successfully connected to PostgreSQL Database!');
    } catch (pgError) {
      console.warn('PostgreSQL connection failed:', (pgError as Error).message);
      console.warn('Falling back to local SQLite database (database.sqlite)...');
      if (pool) {
        try { await pool.end(); } catch (_) {}
        pool = null;
      }
    }
  }

  if (pgConnected && pool) {
    try {
      // Create tables in PostgreSQL
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
          email TEXT UNIQUE,
          tob TEXT,
          pob TEXT,
          is_mock BOOLEAN DEFAULT false
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
          astro_unlocked INTEGER DEFAULT 0,
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

      // Migrations for PostgreSQL
      const alterQueries = [
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS family_details TEXT DEFAULT '{}';`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT false;`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS tob TEXT;`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS pob TEXT;`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_mock BOOLEAN DEFAULT false;`,
        `ALTER TABLE interests ADD COLUMN IF NOT EXISTS astro_unlocked INTEGER DEFAULT 0;`,
        `CREATE TABLE IF NOT EXISTS phone_unlocks (id TEXT PRIMARY KEY, unlocker_id TEXT NOT NULL, unlocked_user_id TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(unlocker_id, unlocked_user_id));`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_visible BOOLEAN DEFAULT false;`
      ];

      for (const q of alterQueries) {
        try { await pool.query(q); } catch (_) {}
      }
      return;
    } catch (err) {
      console.error('PostgreSQL table creation failed, initializing SQLite fallback:', err);
    }
  }

  // SQLite fallback (dynamically required)
  isSqlite = true;
  const dbPath = path.join(__dirname, '../database.sqlite');
  const sqlite3 = require('sqlite3');
  const sqliteDb = new sqlite3.Database(dbPath);

  sqliteAdapter = {
    get: (sql: string, params: any[] = []): Promise<any> => {
      return new Promise((resolve, reject) => {
        sqliteDb.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    all: (sql: string, params: any[] = []): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
    },
    run: (sql: string, params: any[] = []): Promise<void> => {
      return new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  };

  // Ensure tables exist in SQLite
  await sqliteAdapter.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone_number TEXT UNIQUE NOT NULL,
      name TEXT,
      age INTEGER,
      dob TEXT,
      place TEXT,
      gender TEXT,
      interested_in TEXT,
      photos TEXT DEFAULT '[]',
      is_onboarded INTEGER DEFAULT 0,
      aadhaar_verified INTEGER DEFAULT 0,
      face_verified INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      roses_balance INTEGER DEFAULT 0,
      referral_code TEXT UNIQUE,
      referred_by TEXT,
      last_free_rose_at TIMESTAMP,
      family_details TEXT DEFAULT '{}',
      email TEXT,
      tob TEXT,
      pob TEXT,
      is_mock INTEGER DEFAULT 0,
      phone_visible INTEGER DEFAULT 0
    );
  `);

  // Migrations for SQLite
  const alterSqliteQueries = [
    `ALTER TABLE users ADD COLUMN email TEXT;`,
    `ALTER TABLE users ADD COLUMN family_details TEXT DEFAULT '{}';`,
    `ALTER TABLE users ADD COLUMN face_verified INTEGER DEFAULT 0;`,
    `ALTER TABLE users ADD COLUMN aadhaar_verified INTEGER DEFAULT 0;`,
    `ALTER TABLE users ADD COLUMN tob TEXT;`,
    `ALTER TABLE users ADD COLUMN pob TEXT;`,
    `ALTER TABLE users ADD COLUMN is_mock INTEGER DEFAULT 0;`,
    `ALTER TABLE users ADD COLUMN phone_visible INTEGER DEFAULT 0;`
  ];

  for (const q of alterSqliteQueries) {
    try { await sqliteAdapter.run(q); } catch (_) {}
  }

  console.log('SQLite Database initialized successfully!');
}

export function getDb() {
  if (isSqlite && sqliteAdapter) {
    return sqliteAdapter;
  }
  if (pool) {
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
  if (sqliteAdapter) {
    return sqliteAdapter;
  }
  throw new Error("Database not initialized");
}

