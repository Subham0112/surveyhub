import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@surveybuilder.local').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'admin12345';
  const name = process.env.ADMIN_NAME ?? 'Workspace Admin';

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: Role.ADMIN },
    create: { name, email, passwordHash, role: Role.ADMIN },
  });

  console.log(`Admin account ready: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
