// Creates the first super admin (there is no sign-up for admins), or resets an
// existing admin's password. Prints a random password once; change it after
// signing in.
//
//   DATABASE_URL=... npm run create-admin --workspace=apps/backend -- you@venohq.com "Your Name"
import { randomBytes } from 'node:crypto';
import { hash } from 'bcryptjs';
import { Pool } from 'pg';

async function main() {
  const [rawEmail, ...nameParts] = process.argv.slice(2);
  const email = rawEmail?.trim();
  const name = nameParts.join(' ').trim();
  if (!email?.includes('@') || !name) {
    console.error('Usage: npm run create-admin -- <email> "<full name>"');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const password = randomBytes(12).toString('base64url');
  const passwordHash = await hash(password, 10);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const { rows } = await pool.query<{ created: boolean }>(
      `INSERT INTO admins (name, email, password_hash) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING (xmax = 0) AS created`,
      [name, email, passwordHash],
    );
    console.log(`${rows[0].created ? 'Created' : 'Reset password for'} admin ${email}`);
    console.log(`Password: ${password}`);
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
