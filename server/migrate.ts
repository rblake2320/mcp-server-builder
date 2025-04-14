import { pool, db } from './db';
import { sql } from 'drizzle-orm';
import { log } from './vite';

async function runMigration() {
  log('Starting database migration...', 'migration');
  
  try {
    // Check if github_id column exists in users table
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'github_id';
    `;
    
    const result = await pool.query(checkColumnQuery);
    
    if (result.rows.length === 0) {
      log('Adding github_id column to users table...', 'migration');
      
      // Add the missing columns if they don't exist
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS github_id TEXT,
        ADD COLUMN IF NOT EXISTS github_username TEXT,
        ADD COLUMN IF NOT EXISTS github_token TEXT;
      `);
      
      log('Migration completed successfully!', 'migration');
    } else {
      log('GitHub columns already exist in users table. No migration needed.', 'migration');
    }
  } catch (error) {
    log(`Migration failed: ${error}`, 'migration');
    throw error;
  }
}

export { runMigration };