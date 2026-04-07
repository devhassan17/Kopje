import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  // Initialize table if it doesn't exist (Only for first run)
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS leaderboards (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        score INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
  } catch (error) {
    console.error('Table creation error:', error);
  }

  // Handle GET (fetch top 10 scores)
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
    const { name, score } = request.body;
    
    if (!name || score === undefined) {
      return response.status(400).json({ error: 'Name and score are required' });
    }

    try {
      await sql`
        INSERT INTO leaderboards (name, score) 
        VALUES (${name}, ${score})
      `;
      return response.status(201).json({ message: 'Score submitted successfully' });
    } catch (error) {
      return response.status(500).json({ error: error.message });
    }
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
