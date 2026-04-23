import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  try {
    // Aggregate plays and high scores by email
    const { rows } = await sql`
      SELECT 
        email, 
        MAX(name) as name, 
        COUNT(*) as total_plays, 
        MAX(score) as highest_score,
        MAX(created_at) as last_played
      FROM leaderboards 
      WHERE email IS NOT NULL
      GROUP BY email
      ORDER BY highest_score DESC
    `;
    return response.status(200).json(rows);
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
