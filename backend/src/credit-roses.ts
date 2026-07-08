import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Update these 3 emails with the actual accounts you want to credit
const emailsToCredit = [
  'sree@gmail.com',
  'harish@gmail.com',
  'sravanthi@gmail.com'
];

async function run() {
  console.log('Connecting to database and executing credit...');
  try {
    const res = await pool.query(
      `UPDATE users 
       SET roses_balance = COALESCE(roses_balance, 0) + 1000 
       WHERE email IN ($1, $2, $3)
       RETURNING id, name, email, roses_balance;`,
      emailsToCredit
    );

    console.log(`\nSuccessfully updated ${res.rowCount} users:`);
    res.rows.forEach(row => {
      console.log(`- ${row.name || 'No Name'} (${row.email}): New Balance = ${row.roses_balance} roses`);
    });
  } catch (error) {
    console.error('Error executing query:', error);
  } finally {
    await pool.end();
  }
}

run();
