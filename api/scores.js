import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  // Resilient schema management
  try {
    await sql`CREATE TABLE IF NOT EXISTS leaderboards (id SERIAL PRIMARY KEY, name VARCHAR(50), score INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
    // Attempt to add email column if it's missing (fails gracefully if already exists)
    try { await sql`ALTER TABLE leaderboards ADD COLUMN email VARCHAR(100);`; } catch (e) {}
  } catch (error) {
    console.error('Database Init Warning:', error);
  }

  // Handle GET (fetch top 10 scores for public leaderboard)
  if (request.method === 'GET') {
    try {
      const { rows } = await sql`
        SELECT name, score 
        FROM leaderboards 
        ORDER BY score DESC 
        LIMIT 10
      `;
      return response.status(200).json(rows);
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }

  // Handle POST (submit new score)
  if (request.method === 'POST') {
    const { name, score, email } = request.body;
    
    if (!name || score === undefined) {
      return response.status(400).json({ error: 'Name and score are required' });
    }

    try {
      await sql`
        INSERT INTO leaderboards (name, score, email) 
        VALUES (${name}, ${score}, ${email || null})
      `;
      return response.status(201).json({ message: 'Score submitted successfully' });
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
