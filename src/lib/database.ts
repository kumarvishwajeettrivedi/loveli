import postgres from 'postgres';

let sql: postgres.Sql | null = null;

export async function getDatabase(): Promise<postgres.Sql> {
  if (!sql) {
    sql = postgres(process.env.DATABASE_URL as string);
    
    // Create tables if they don't exist
    await createTables();
  }
  
  return sql;
}

async function createTables(): Promise<void> {
  if (!sql) return;

  try {
    // Create blocked users table
    await sql`
      CREATE TABLE IF NOT EXISTS blocked_users (
        id SERIAL PRIMARY KEY,
        uuid TEXT UNIQUE NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create abuse reports table
    await sql`
      CREATE TABLE IF NOT EXISTS abuse_reports (
        id SERIAL PRIMARY KEY,
        reporter_uuid TEXT NOT NULL,
        reported_uuid TEXT NOT NULL,
        reason TEXT,
        evidence TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        resolved BOOLEAN DEFAULT FALSE
      )
    `;

    // Create chat sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id SERIAL PRIMARY KEY,
        session_id TEXT UNIQUE NOT NULL,
        user1_uuid TEXT NOT NULL,
        user2_uuid TEXT NOT NULL,
        interests TEXT[],
        started_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP,
        duration INTEGER
      )
    `;

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
  }
}

export async function closeDatabase(): Promise<void> {
  if (sql) {
    await sql.end();
    sql = null;
  }
}

export default getDatabase;
