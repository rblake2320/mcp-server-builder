import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure websocket for Neon database
neonConfig.webSocketConstructor = ws;

async function applyMigration() {
  // Make sure we have a DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable not set');
    process.exit(1);
  }

  // Connect to database
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  try {
    // Add GitHub columns to the users table if they don't exist
    console.log('Adding GitHub columns to users table...');
    
    // Check if github_id column exists
    const githubIdExists = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'github_id'
    `);
    
    if (githubIdExists.length === 0) {
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN github_id TEXT,
        ADD COLUMN github_username TEXT,
        ADD COLUMN github_token TEXT
      `);
      console.log('Added GitHub columns successfully');
    } else {
      console.log('GitHub columns already exist');
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

applyMigration();