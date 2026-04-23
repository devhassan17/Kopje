import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(request, response) {
  const client = await pool.connect();
  try {
    // Ensure settings table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT
      );
    `);

    // Handle GET (fetch settings)
    if (request.method === 'GET') {
      const { rows } = await client.query('SELECT * FROM app_settings');
      const settings = {};
      rows.forEach(row => settings[row.key] = row.value);
      return response.status(200).json(settings);
    }

    // Handle POST (update settings)
    if (request.method === 'POST') {
      const { settings, password } = request.body;
      
      // Simple auth check for settings update
      if (password !== 'moyeeadmin') {
        return response.status(401).json({ error: 'Unauthorized' });
      }

      for (const [key, value] of Object.entries(settings)) {
        await client.query(`
          INSERT INTO app_settings (key, value) 
          VALUES ($1, $2) 
          ON CONFLICT (key) DO UPDATE SET value = $2
        `, [key, value]);
      }
      return response.status(200).json({ message: 'Settings updated successfully' });
    }

    return response.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Settings API Error:', error);
    return response.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}
