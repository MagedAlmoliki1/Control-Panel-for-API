// lib/db.ts

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  prismaInstance = globalForPrisma.prisma;
} else {
  // Resolve absolute path to the SQLite database
  const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  
  // Pass config object with url directly. PrismaBetterSqlite3 instantiates better-sqlite3 driver internally.
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  
  prismaInstance = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;
