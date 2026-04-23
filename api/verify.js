import { Pool } from 'pg';
import nodemailer from 'nodemailer';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, test } = request.body;
  const client = await pool.connect();

  try {
    // 1. Fetch Email Settings
    const { rows } = await client.query('SELECT * FROM app_settings');
    const settings = {};
    rows.forEach(row => settings[row.key] = row.value);

    if (!settings.smtp_host || !settings.smtp_user) {
      return response.status(400).json({ error: 'Email system not configured. Please contact admin.' });
    }

    // 2. Setup Transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: parseInt(settings.smtp_port) || 587,
      secure: settings.smtp_port == 465,
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_pass
      }
    });

    // 3. Prepare Email
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const subject = test ? 'Kopje Gooien - Test Email' : 'Kopje Gooien - Verification Code';
    const body = test ? 
      `This is a test email to verify your SMTP settings. Your system is working correctly!` :
      `Hello ${name || 'Player'},\n\nYour verification code for Kopje Gooien is: ${code}\n\nEnter this code to start the game!`;

    // 4. Send Email
    await transporter.sendMail({
      from: `"Kopje Gooien" <${settings.smtp_user}>`,
      to: email,
      subject: subject,
      text: body
    });

    return response.status(200).json({ message: 'Email sent successfully', code: test ? null : code });
  } catch (error) {
    console.error('Email Error:', error);
    return response.status(500).json({ error: 'Failed to send email: ' + error.message });
  } finally {
    client.release();
  }
}
