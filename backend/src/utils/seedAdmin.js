import argon2 from 'argon2';
import prisma from '../config/database.js';

export async function seedAdmin() {
  const emailSeed = process.env.ADMIN_EMAIL_SEED;
  const passwordSeed = process.env.ADMIN_PASSWORD_SEED;

  if (!emailSeed || !passwordSeed) {
    console.log('[Seed] ADMIN_EMAIL_SEED or ADMIN_PASSWORD_SEED not set. Skipping admin seed.');
    return;
  }

  // Safely normalize email to match authController's case handling
  const normalizedEmail = emailSeed.trim().toLowerCase();

  try {
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' }
      }
    });

    if (existingAdmin) {
      console.log(`[Seed] Admin account ${normalizedEmail} already exists. Skipping creation.`);
      return;
    }

    const passwordHash = await argon2.hash(passwordSeed);

    await prisma.admin.create({
      data: {
        email: normalizedEmail,
        passwordHash: passwordHash
      }
    });

    console.log(`[Seed] Successfully created initial admin account: ${normalizedEmail}`);
  } catch (err) {
    console.error('[Seed] Failed to seed admin account:', err.message);
  }
}
