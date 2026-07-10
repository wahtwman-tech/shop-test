import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema.js";

// مطلوب لتشغيل الـ driver في بيئة Node (خارج Edge/Serverless)
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL غير موجود في ملف .env - تأكد من إضافة رابط الاتصال بقاعدة Neon"
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
