import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { sendVerificationEmail } from "../utils/email.js";
import { signToken, AUTH_COOKIE_NAME, cookieOptions } from "../utils/jwt.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
const registerSchema = z.object({
    email: z.string().email("البريد الإلكتروني غير صالح"),
    password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});
/**
 * POST /api/auth/register
 * تسجيل مستخدم جديد + إرسال إيميل تفعيل فوري عبر Resend
 */
router.post("/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { email, password } = parsed.data;
    try {
        const existing = await db.query.users.findFirst({
            where: eq(users.email, email),
        });
        if (existing) {
            return res.status(409).json({ message: "هذا البريد الإلكتروني مسجّل مسبقاً" });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const [newUser] = await db
            .insert(users)
            .values({
            email,
            passwordHash,
            isVerified: false,
            verificationToken,
        })
            .returning();
        const emailResult = await sendVerificationEmail(email, verificationToken);
        if (!emailResult.success) {
            console.warn(`تم إنشاء الحساب لكن فشل إرسال إيميل التفعيل للمستخدم ${email}`);
        }
        return res.status(201).json({
            message: "تم إنشاء الحساب بنجاح. يرجى تفقد بريدك الإلكتروني لتفعيل الحساب.",
            userId: newUser.id,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "حدث خطأ أثناء إنشاء الحساب" });
    }
});
const verifySchema = z.object({
    token: z.string().min(1),
});
/**
 * POST /api/auth/verify
 * تفعيل الحساب باستخدام رمز التحقق المرسل بالإيميل
 */
router.post("/verify", async (req, res) => {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "رمز التحقق مطلوب" });
    }
    const { token } = parsed.data;
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.verificationToken, token),
        });
        if (!user) {
            return res.status(400).json({ message: "رمز التحقق غير صالح أو منتهي" });
        }
        if (user.isVerified) {
            return res.status(200).json({ message: "الحساب مفعّل بالفعل" });
        }
        await db
            .update(users)
            .set({ isVerified: true, verificationToken: null })
            .where(eq(users.id, user.id));
        return res.status(200).json({ message: "تم تفعيل الحساب بنجاح، يمكنك تسجيل الدخول الآن" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "حدث خطأ أثناء تفعيل الحساب" });
    }
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
/**
 * POST /api/auth/login
 * تسجيل الدخول - يرفض إن لم يكن الحساب مفعّلاً (is_verified = true)
 * وينشئ JWT في HTTP-only Cookie لتثبيت الجلسة
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
        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
            return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        }
        // === الشرط الحاسم: منع تسجيل الدخول للحسابات غير المفعّلة ===
        if (!user.isVerified) {
            return res.status(403).json({
                message: "يجب تفعيل حسابك عبر البريد الإلكتروني قبل تسجيل الدخول",
                needsVerification: true,
            });
        }
        const token = signToken({
            userId: user.id,
            email: user.email,
            isAdmin: user.isAdmin,
        });
        res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
        return res.status(200).json({
            message: "تم تسجيل الدخول بنجاح",
            user: { id: user.id, email: user.email, isAdmin: user.isAdmin },
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "حدث خطأ أثناء تسجيل الدخول" });
    }
});
/**
 * POST /api/auth/logout
 */
router.post("/logout", (_req, res) => {
    res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
    return res.status(200).json({ message: "تم تسجيل الخروج" });
});
/**
 * GET /api/auth/me
 * إرجاع بيانات المستخدم الحالي بناءً على الجلسة (للحفاظ على تسجيل الدخول عند تحديث الصفحة)
 */
router.get("/me", requireAuth, async (req, res) => {
    const user = await db.query.users.findFirst({
        where: eq(users.id, req.user.userId),
        columns: { id: true, email: true, isAdmin: true, isVerified: true, createdAt: true },
    });
    if (!user)
        return res.status(404).json({ message: "المستخدم غير موجود" });
    return res.json({ user });
});
export default router;
