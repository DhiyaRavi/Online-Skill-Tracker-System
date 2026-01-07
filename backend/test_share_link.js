// Test script to verify share link generation
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function testShareLink() {
  try {
    console.log('=== Testing Share Link System ===\n');
    
    // 1. Check all users
    const users = await pool.query('SELECT id, email FROM users LIMIT 5');
    console.log('Users in database:');
    users.rows.forEach(u => console.log(`  - ID: ${u.id}, Email: ${u.email}`));
    console.log('');
    
    // 2. Check user_profiles
    const profiles = await pool.query('SELECT user_id, share_token FROM user_profiles');
    console.log(`User profiles with share tokens: ${profiles.rows.length}`);
    profiles.rows.forEach(p => console.log(`  - User ID: ${p.user_id}, Token: ${p.share_token || '(none)'}`));
    console.log('');
    
    // 3. Check if specific token exists
    const testToken = '82a7b573c0fa53553';
    const tokenCheck = await pool.query('SELECT user_id FROM user_profiles WHERE share_token=$1', [testToken]);
    console.log(`Token '${testToken}' exists: ${tokenCheck.rows.length > 0 ? 'YES' : 'NO'}`);
    console.log('');
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testShareLink();
