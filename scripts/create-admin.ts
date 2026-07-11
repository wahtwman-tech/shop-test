import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../server/db/index.js";
import { users } from "../server/db/schema.js";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "adminfayiz@fayizshop.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123";

async function createAdmin() {
  console.log("🔧 جارِ إنشاء حساب الأدمن...");
  
  try {
    // التحقق إذا الأدمن موجود
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.email, ADMIN_EMAIL),
    });

    if (existingAdmin) {
      console.log("⚠️ الأدمن موجود بالفعل:", ADMIN_EMAIL);
      console.log("   ID:", existingAdmin.id);
      return;
    }

    // إنشاء الأدمن
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const [newAdmin] = await db
      .insert(users)
      .values({
        email: ADMIN_EMAIL,
        passwordHash,
        isVerified: true,
        isAdmin: true,
      })
      .returning();

    console.log("✅ تم إنشاء حساب الأدمن بنجاح!");
    console.log("   البريد:", newAdmin.email);
    console.log("   ID:", newAdmin.id);
    console.log("   كلمة المرور:", ADMIN_PASSWORD);
    
  } catch (err) {
    console.error("❌ خطأ:", err);
    process.exit(1);
  }
}

createAdmin();
