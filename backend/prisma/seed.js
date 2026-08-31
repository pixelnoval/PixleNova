// Prisma seed script — creates or updates the Admin account.
//
// Usage:
//   1. Set ADMIN_EMAIL_SEED and ADMIN_PASSWORD_SEED in your .env
//   2. Run: npm run prisma:seed
//
// This script is IDEMPOTENT and uses upsert:
//   - If no admin with the given email exists → creates it
//   - If an admin already exists with the given email → updates the password hash
// Running it multiple times is always safe.

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL_SEED;
  const password = process.env.ADMIN_PASSWORD_SEED;

  if (!email || !password) {
    console.error('ADMIN_EMAIL_SEED and ADMIN_PASSWORD_SEED must be set in .env');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('ADMIN_PASSWORD_SEED must be at least 8 characters');
    process.exit(1);
  }

  // Hash the password using Argon2id — identical to the auth controller verification
  const passwordHash = await argon2.hash(password);

  // Upsert: create if not exists, update password hash if already exists
  const admin = await prisma.admin.upsert({
    where:  { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log('Admin account configured: ' + admin.email);
  console.log('Password has been hashed with Argon2id. Plaintext is NOT in the database.');
}

main()
  .catch((err) => {
    console.error('Seed failed: ' + err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
