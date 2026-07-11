import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { orders, users } from "../db/schema.js";
import { requireAdmin } from "../middleware/auth.js";
import { sendOrderStatusEmail } from "../utils/email.js";
const router = Router();
router.use(requireAdmin);
/**
 * GET /api/admin/orders
 * عرض كل الطلبات الواردة من جميع العملاء (لوحة تحكم الأدمن)
 */
router.get("/orders", async (_req, res) => {
    const allOrders = await db.query.orders.findMany({
        with: {
            user: { columns: { id: true, email: true } },
            items: { with: { product: true } },
        },
        orderBy: (o, { desc }) => [desc(o.createdAt)],
    });
    return res.json({ orders: allOrders });
});
const statusSchema = z.object({
    status: z.enum(["pending", "processing", "delivered", "rejected"]),
});
/**
 * PATCH /api/admin/orders/:id/status
 * تغيير حالة الطلب (بكبسة زر) + إرسال إيميل تلقائي للعميل بالتحديث عبر Resend
 */
router.patch("/orders/:id/status", async (req, res) => {
    const id = Number(req.params.id);
    const parsed = statusSchema.safeParse(req.body);
    if (Number.isNaN(id) || !parsed.success) {
        return res.status(400).json({ message: "بيانات غير صالحة" });
    }
    try {
        const [updatedOrder] = await db
            .update(orders)
            .set({ status: parsed.data.status })
            .where(eq(orders.id, id))
            .returning();
        if (!updatedOrder) {
            return res.status(404).json({ message: "الطلب غير موجود" });
        }
        const customer = await db.query.users.findFirst({
            where: eq(users.id, updatedOrder.userId),
            columns: { email: true },
        });
        if (customer) {
            // إرسال الإشعار بشكل غير معطّل (لا ننتظره ليمنع تأخير الاستجابة، لكن نسجل الخطأ إن حدث)
            sendOrderStatusEmail(customer.email, updatedOrder.id, updatedOrder.status).catch((err) => console.error("فشل إرسال إشعار تحديث الطلب:", err));
        }
        return res.json({ message: "تم تحديث حالة الطلب", order: updatedOrder });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "حدث خطأ أثناء تحديث حالة الطلب" });
    }
});
export default router;
