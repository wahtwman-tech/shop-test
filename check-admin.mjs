import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_GUR6tL7Biyal@ep-dry-bonus-adklrgh2-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require");

const result = await sql`SELECT id, email, is_admin, is_verified FROM users WHERE email = 'adminfayiz@fayizshop.com'`;
console.log(JSON.stringify(result, null, 2));
