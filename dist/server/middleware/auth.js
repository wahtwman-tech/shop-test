import { verifyToken, AUTH_COOKIE_NAME } from "../utils/jwt.js";
/**
 * يتحقق من وجود جلسة صالحة (JWT) في الكوكيز
 * لا يمنع الطلب إن لم توجد جلسة - فقط يعبّئ req.user إن وُجدت (مفيد لصفحات اختيارية)
 */
export function attachUser(req, _res, next) {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    if (token) {
        const payload = verifyToken(token);
        if (payload)
            req.user = payload;
    }
    next();
}
/**
 * يفرض تسجيل الدخول - يرفض الطلب إن لم توجد جلسة صالحة
 */
export function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    next();
}
/**
 * يفرض أن يكون المستخدم أدمن
 */
export function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
    }
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: "هذا الإجراء متاح للأدمن فقط" });
    }
    next();
}
