import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = 'Pixelnovaltd@gmail.com';
  const plainPassword = '9445132466@';

  // The application's auth controller (src/controllers/authController.js) expects 
  // an Argon2id hash (argon2.verify), so we MUST use argon2 instead of bcrypt.
  const passwordHash = await argon2.hash(plainPassword);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { 
      passwordHash 
    },
    create: {
      id: 'admin01',
      email,
      passwordHash,
    },
  });

  console.log('✅ Admin account successfully created/updated:');
  console.log(`ID: ${admin.id}`);
  console.log(`Email: ${admin.email}`);
  console.log(`Password Hash: <hidden>`);
}

main()
  .catch((err) => {
    console.error('❌ Failed to create admin account:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
