import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(request, response) {
  const client = await pool.connect();
  try {
    // Ensure table exists before querying
    await client.query(`CREATE TABLE IF NOT EXISTS leaderboards (id SERIAL PRIMARY KEY, name VARCHAR(50), score INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, email VARCHAR(100));`);
    
    // Aggregate plays and high scores by email
    const { rows } = await client.query(`
      SELECT 
        COALESCE(email, 'Unregistered') as email, 
        MAX(name) as name, 
        COUNT(*) as total_plays, 
        MAX(score) as highest_score,
        MAX(created_at) as last_played
      FROM leaderboards 
      GROUP BY email
      ORDER BY highest_score DESC
    `);
    return response.status(200).json(rows);
  } catch (error) {
    console.error('Admin API Error:', error);
    return response.status(500).json({ error: error.message || 'Internal Server Error' });
  } finally {
    client.release();
  }
}
