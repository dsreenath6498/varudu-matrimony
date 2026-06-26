import { Pool } from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

const malePhotos = [
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&q=80',
  'https://images.unsplash.com/photo-1550246140-5119ae4790b8?w=800&q=80',
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=800&q=80',
  'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=800&q=80',
  'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800&q=80',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=800&q=80',
];

const femalePhotos = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&q=80',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&q=80',
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=800&q=80',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=800&q=80',
];

const maleNames = ['Raju', 'Kiran', 'Vikram', 'Ravi', 'Sanjay', 'Prakash', 'Gopi', 'Ram', 'Ashok', 'Suresh', 'Karthik', 'Nikhil', 'Rahul', 'Arun', 'Vinay'];
const femaleNames = ['Priya', 'Anjali', 'Swathi', 'Kavya', 'Sneha', 'Neha', 'Divya', 'Pooja', 'Shruthi', 'Ramya', 'Nisha', 'Meghana', 'Sindhu', 'Keerthi', 'Bhavya'];
const places = ['Hyderabad', 'Vizag', 'Vijayawada', 'Warangal', 'Guntur', 'Tirupati', 'Rajahmundry', 'Kakinada', 'Nellore', 'Kurnool'];

const seedDB = async () => {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL must be set in .env to seed the database");
    return;
  }

  const query = `
    INSERT INTO users (id, phone_number, name, age, dob, place, gender, interested_in, photos, is_onboarded, roses_balance)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `;

  // Create 15 Male Profiles
  for (let i = 0; i < 15; i++) {
    const id = crypto.randomUUID();
    const phone = `99999991${i.toString().padStart(2, '0')}`;
    const name = maleNames[i];
    const age = Math.floor(Math.random() * 10) + 24; // 24-33
    const dob = `19${99 - (age - 24)}-01-01`;
    const place = places[Math.floor(Math.random() * places.length)];
    const photo = [malePhotos[i % malePhotos.length]];

    await pool.query(query, [id, phone, name, age, dob, place, 'Male', 'Female', JSON.stringify(photo), 1, 10]);
  }

  // Create 15 Female Profiles
  for (let i = 0; i < 15; i++) {
    const id = crypto.randomUUID();
    const phone = `88888881${i.toString().padStart(2, '0')}`;
    const name = femaleNames[i];
    const age = Math.floor(Math.random() * 8) + 22; // 22-29
    const dob = `19${99 - (age - 22)}-01-01`;
    const place = places[Math.floor(Math.random() * places.length)];
    const photo = [femalePhotos[i % femalePhotos.length]];

    await pool.query(query, [id, phone, name, age, dob, place, 'Female', 'Male', JSON.stringify(photo), 1, 10]);
  }

  console.log('Successfully seeded 30 profiles into the PostgreSQL database!');
  process.exit(0);
};

seedDB();
