import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.message.count();
  if (count === 0) {
    await prisma.message.create({ data: { text: 'Hello from Postgres via NestJS!' } });
    console.log('Seeded Message');
  } else {
    console.log('Message already exists, skipping seed');
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
