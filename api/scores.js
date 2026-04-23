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
    // Resilient schema management
    await client.query(`CREATE TABLE IF NOT EXISTS leaderboards (id SERIAL PRIMARY KEY, name VARCHAR(50), score INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, email VARCHAR(100));`);

    // Handle GET (fetch top 10 scores for public leaderboard)
    if (request.method === 'GET') {
      const { rows } = await client.query(`
        SELECT name, score 
        FROM leaderboards 
        ORDER BY score DESC 
        LIMIT 10
      `);
      return response.status(200).json(rows);
    }

    // Handle POST (submit new score)
    if (request.method === 'POST') {
      const { name, score, email } = request.body;
      
      if (!name || score === undefined) {
        return response.status(400).json({ error: 'Name and score are required' });
      }

      await client.query(`
        INSERT INTO leaderboards (name, score, email) 
        VALUES ($1, $2, $3)
      `, [name, score, email || null]);
      
      return response.status(201).json({ message: 'Score submitted successfully' });
    }

    return response.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database Error:', error);
    return response.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}
