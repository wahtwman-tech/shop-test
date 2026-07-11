import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { signToken, AUTH_COOKIE_NAME, cookieOptions, verifyToken } from "../../utils/jwt.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * GET /api/admin/me
 * الحصول على بيانات الأدمن الحالي
 */
router.get("/me", async (req, res) => {
  const token = req.cookies[AUTH_COOKIE_NAME];
  
  if (!token) {
    return res.status(401).json({ message: "غير مصرح" });
  }

  try {
    const payload = verifyToken(token);
    
    if (!payload || !payload.isAdmin) {
      return res.status(403).json({ message: "ليس لديك صلاحية" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
      columns: { id: true, email: true, isAdmin: true },
    });

    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    return res.json({ user });
  } catch {
    return res.status(401).json({ message: "جلسة غير صالحة" });
  }
});

/**
 * POST /api/admin/login
 * تسجيل دخول الأدمن - يستخدم جدول users مع isAdmin = true
 */
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "بيانات الدخول غير صحيحة" });
  }
  const { email, password } = parsed.data;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }

    // التحقق أن المستخدم أدمن
    if (!user.isAdmin) {
      return res.status(403).json({ message: "ليس لديك صلاحية الدخول للأدمن" });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }

    // إنشاء JWT للأدمن
    const token = signToken({
      userId: user.id,
      email: user.email,
      isAdmin: true,
    });

    res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);

    return res.status(200).json({
      message: "تم تسجيل الدخول بنجاح",
      user: { id: user.id, email: user.email, isAdmin: true },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول" });
  }
});

/**
 * POST /api/admin/logout
 */
router.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
  return res.status(200).json({ message: "تم تسجيل الخروج" });
});

/**
 * POST /api/admin/setup
 * إنشاء حساب الأدمن الأول (يُستدعى مرة واحدة فقط)
 */
router.post("/setup", async (req, res) => {
  const adminEmail = process.env.ADMIN_EMAIL || "adminfayiz@fayizshop.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123";

  try {
    // التحقق إذا الأدمن موجود
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.email, adminEmail),
    });

    if (existingAdmin) {
      return res.status(400).json({ message: "الأدمن موجود بالفعل" });
    }

    // إنشاء الأدمن
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const [newAdmin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        passwordHash,
        isVerified: true, // الأدمن لا يحتاج تفعيل
        isAdmin: true,
      })
      .returning();

    return res.status(201).json({
      message: "تم إنشاء حساب الأدمن بنجاح",
      admin: { id: newAdmin.id, email: newAdmin.email },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "حدث خطأ أثناء إنشاء الأدمن" });
  }
});

export default router;
