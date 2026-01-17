import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: 'require',
  },
} satisfies Config;
