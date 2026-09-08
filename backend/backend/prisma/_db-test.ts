import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.$queryRawUnsafe('SELECT 1')
  .then((r) => {
    console.log('OK', JSON.stringify(r));
    process.exit(0);
  })
  .catch((e) => {
    console.log('ERR', e.message);
    process.exit(1);
  });
