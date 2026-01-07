// Direct test of the UPSERT query
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function testUpsert() {
  try {
    console.log('=== Testing UPSERT Query ===\n');
    
    // Get a real user ID
    const users = await pool.query('SELECT id FROM users LIMIT 1');
    if (users.rows.length === 0) {
      console.log('No users found in database!');
      await pool.end();
      return;
    }
    
    const testUserId = users.rows[0].id;
    const testToken = crypto.randomBytes(16).toString('hex');
    
    console.log(`Test User ID: ${testUserId}`);
    console.log(`Test Token: ${testToken}\n`);
    
    // Try the UPSERT
    console.log('Executing UPSERT...');
    await pool.query(`
      INSERT INTO user_profiles (user_id, share_token) 
      VALUES ($1, $2)
      ON CONFLICT (user_id) 
      DO UPDATE SET share_token = $2
    `, [testUserId, testToken]);
    
    console.log('✅ UPSERT successful!\n');
    
    // Verify it was saved
    const check = await pool.query(
      'SELECT share_token FROM user_profiles WHERE user_id=$1',
      [testUserId]
    );
    
    if (check.rows.length > 0) {
      console.log(`✅ Token verified in database: ${check.rows[0].share_token}`);
      console.log(`Tokens match: ${check.rows[0].share_token === testToken ? 'YES' : 'NO'}`);
    } else {
      console.log('❌ No profile found after UPSERT!');
    }
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
}

testUpsert();
