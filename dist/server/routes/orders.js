import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { cartItems, orderItems, orders, products } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.use(requireAuth);
/**
 * POST /api/orders
 * إتمام الشراء (Checkout): يحوّل محتوى سلة المستخدم إلى طلب جديد
 * متاح فقط للمستخدمين المسجّلين دخول (وبالتالي المفعّلين حصراً)
 */
router.post("/", async (req, res) => {
    const userId = req.user.userId;
    try {
        const items = await db.query.cartItems.findMany({
            where: eq(cartItems.userId, userId),
            with: { product: true },
        });
        if (items.length === 0) {
            return res.status(400).json({ message: "سلة التسوق فارغة" });
        }
        // التحقق من توفر الكمية بالمخزون
        for (const item of items) {
            if (item.product.stock < item.quantity) {
                return res.status(400).json({
                    message: `الكمية المتوفرة من "${item.product.nameAr}" غير كافية`,
                });
            }
        }
        const totalPrice = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
        // إنشاء الطلب وتفاصيله ضمن معاملة واحدة (Transaction)
        const order = await db.transaction(async (tx) => {
            const [newOrder] = await tx
                .insert(orders)
                .values({
                userId,
                status: "pending",
                totalPrice: totalPrice.toString(),
            })
                .returning();
            await tx.insert(orderItems).values(items.map((item) => ({
                orderId: newOrder.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price,
            })));
            // تحديث المخزون
            for (const item of items) {
                await tx
                    .update(products)
                    .set({ stock: item.product.stock - item.quantity })
                    .where(eq(products.id, item.productId));
            }
            // تفريغ السلة بعد إتمام الطلب
            await tx.delete(cartItems).where(eq(cartItems.userId, userId));
            return newOrder;
        });
        return res.status(201).json({ message: "تم إنشاء الطلب بنجاح", order });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "حدث خطأ أثناء إتمام الطلب" });
    }
});
/**
 * GET /api/orders
 * أرشيف طلبات المستخدم السابقة مع حالتها
 */
router.get("/", async (req, res) => {
    const userOrders = await db.query.orders.findMany({
        where: eq(orders.userId, req.user.userId),
        with: { items: { with: { product: true } } },
        orderBy: (o, { desc }) => [desc(o.createdAt)],
    });
    return res.json({ orders: userOrders });
});
/**
 * GET /api/orders/:id
 * تفاصيل طلب واحد (يخص المستخدم صاحب الطلب فقط)
 */
router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
        return res.status(400).json({ message: "معرّف غير صالح" });
    const order = await db.query.orders.findFirst({
        where: eq(orders.id, id),
        with: { items: { with: { product: true } } },
    });
    if (!order || order.userId !== req.user.userId) {
        return res.status(404).json({ message: "الطلب غير موجود" });
    }
    return res.json({ order });
});
export default router;
