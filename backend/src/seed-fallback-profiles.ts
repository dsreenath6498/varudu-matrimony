import { Pool } from 'pg';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const malePhotos = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=800&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&q=80',
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=800&q=80'
];

const femalePhotos = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&q=80',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&q=80',
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=800&q=80',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=800&q=80'
];

const maleNames = ['Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Sai', 'Harish', 'Karthik', 'Srinivas', 'Pranav', 'Rohan'];
const femaleNames = ['Aanya', 'Diya', 'Ishitha', 'Ananya', 'Siri', 'Sravanthi', 'Keerthi', 'Bhavana', 'Pooja', 'Shruthi'];
const places = ['Hyderabad', 'Vizag', 'Vijayawada', 'Guntur', 'Warangal', 'Nellore', 'Tirupati'];

async function seed() {
  console.log('Seeding 10 male and 10 female fallback/mock profiles...');
  const query = `
    INSERT INTO users (id, phone_number, name, age, dob, place, gender, interested_in, photos, is_onboarded, roses_balance, is_mock)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (phone_number) DO NOTHING;
  `;

  try {
    // 1. Male fallback profiles
    for (let i = 0; i < 10; i++) {
      const id = crypto.randomUUID();
      const phone = `900000000${i}`;
      const name = maleNames[i];
      const age = Math.floor(Math.random() * 8) + 24; // 24-31
      const dob = `19${99 - (age - 24)}-05-15`;
      const place = places[Math.floor(Math.random() * places.length)];
      const photos = [malePhotos[i]];
      await pool.query(query, [id, phone, name, age, dob, place, 'Male', 'Female', JSON.stringify(photos), 1, 5, true]);
    }

    // 2. Female fallback profiles
    for (let i = 0; i < 10; i++) {
      const id = crypto.randomUUID();
      const phone = `800000000${i}`;
      const name = femaleNames[i];
      const age = Math.floor(Math.random() * 6) + 21; // 21-26
      const dob = `20${2 - (age - 21)}-08-20`;
      const place = places[Math.floor(Math.random() * places.length)];
      const photos = [femalePhotos[i]];
      await pool.query(query, [id, phone, name, age, dob, place, 'Female', 'Male', JSON.stringify(photos), 1, 5, true]);
    }

    console.log('Successfully inserted 10 male and 10 female mock/fallback profiles (is_mock = true)!');
  } catch (error) {
    console.error('Error seeding fallback profiles:', error);
  } finally {
    await pool.end();
  }
}

seed();
