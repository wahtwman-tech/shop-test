import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { cartItems, products } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
// كل مسارات السلة تتطلب تسجيل دخول (وبالتالي حساب مفعّل، لأن الجلسة لا تُمنح إلا لحساب مفعّل)
router.use(requireAuth);
/**
 * GET /api/cart
 * عرض سلة التسوق المحفوظة للمستخدم مع تفاصيل كل منتج
 */
router.get("/", async (req, res) => {
    const items = await db.query.cartItems.findMany({
        where: eq(cartItems.userId, req.user.userId),
        with: { product: true },
    });
    const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
    return res.json({ items, total });
});
const addItemSchema = z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive().default(1),
});
/**
 * POST /api/cart
 * إضافة منتج للسلة (أو زيادة الكمية إن كان موجوداً مسبقاً)
 */
router.post("/", async (req, res) => {
    const parsed = addItemSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { productId, quantity } = parsed.data;
    const product = await db.query.products.findFirst({
        where: eq(products.id, productId),
    });
    if (!product)
        return res.status(404).json({ message: "المنتج غير موجود" });
    const existing = await db.query.cartItems.findFirst({
        where: and(eq(cartItems.userId, req.user.userId), eq(cartItems.productId, productId)),
    });
    if (existing) {
        const [updated] = await db
            .update(cartItems)
            .set({ quantity: existing.quantity + quantity, updatedAt: new Date() })
            .where(eq(cartItems.id, existing.id))
            .returning();
        return res.json({ item: updated });
    }
    const [created] = await db
        .insert(cartItems)
        .values({ userId: req.user.userId, productId, quantity })
        .returning();
    return res.status(201).json({ item: created });
});
const updateItemSchema = z.object({
    quantity: z.number().int().positive(),
});
/**
 * PUT /api/cart/:id
 * تحديث كمية عنصر بالسلة
 */
router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const parsed = updateItemSchema.safeParse(req.body);
    if (Number.isNaN(id) || !parsed.success) {
        return res.status(400).json({ message: "بيانات غير صالحة" });
    }
    const [updated] = await db
        .update(cartItems)
        .set({ quantity: parsed.data.quantity, updatedAt: new Date() })
        .where(and(eq(cartItems.id, id), eq(cartItems.userId, req.user.userId)))
        .returning();
    if (!updated)
        return res.status(404).json({ message: "العنصر غير موجود في سلتك" });
    return res.json({ item: updated });
});
/**
 * DELETE /api/cart/:id
 * حذف عنصر من السلة
 */
router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
        return res.status(400).json({ message: "معرّف غير صالح" });
    const [deleted] = await db
        .delete(cartItems)
        .where(and(eq(cartItems.id, id), eq(cartItems.userId, req.user.userId)))
        .returning();
    if (!deleted)
        return res.status(404).json({ message: "العنصر غير موجود في سلتك" });
    return res.json({ message: "تم حذف العنصر من السلة" });
});
export default router;
