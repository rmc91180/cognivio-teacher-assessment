import knex, { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

// Use DATABASE_URL if available (Railway), otherwise use individual vars (local dev)
const hasDbUrl = !!process.env.DATABASE_URL;
console.log(`Database connection: using ${hasDbUrl ? 'DATABASE_URL' : 'individual vars'}`);
if (hasDbUrl) {
  console.log(`DATABASE_URL host: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]}`);
}

const connection: string | Knex.PgConnectionConfig = process.env.DATABASE_URL
  ? process.env.DATABASE_URL
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'teacher_assessment',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

const config: Knex.Config = {
  client: 'postgresql',
  connection,
  pool: {
    min: 2,
    max: 10,
  },
};

export const db = knex(config);

export default db;
