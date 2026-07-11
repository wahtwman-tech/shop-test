import { Router } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { products } from "../db/schema.js";
import { requireAdmin } from "../middleware/auth.js";
const router = Router();
/**
 * GET /api/products
 * عرض جميع المنتجات (عام - لا يحتاج تسجيل دخول)
 */
router.get("/", async (_req, res) => {
    const all = await db.query.products.findMany({
        orderBy: (p, { desc }) => [desc(p.createdAt)],
    });
    return res.json({ products: all });
});
/**
 * GET /api/products/:id
 */
router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
        return res.status(400).json({ message: "معرّف غير صالح" });
    const product = await db.query.products.findFirst({
        where: eq(products.id, id),
    });
    if (!product)
        return res.status(404).json({ message: "المنتج غير موجود" });
    return res.json({ product });
});
const productSchema = z.object({
    nameAr: z.string().min(1),
    nameEn: z.string().min(1),
    descriptionAr: z.string().optional(),
    descriptionEn: z.string().optional(),
    price: z.number().positive(),
    stock: z.number().int().nonnegative(),
    imageUrl: z.string().url().optional(),
});
/**
 * POST /api/products
 * إضافة منتج جديد (أدمن فقط)
 */
router.post("/", requireAdmin, async (req, res) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const [product] = await db
        .insert(products)
        .values({
        ...parsed.data,
        price: parsed.data.price.toString(),
    })
        .returning();
    return res.status(201).json({ product });
});
/**
 * PUT /api/products/:id
 * تعديل منتج (أدمن فقط)
 */
router.put("/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
        return res.status(400).json({ message: "معرّف غير صالح" });
    const parsed = productSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const updateData = { ...parsed.data };
    if (parsed.data.price !== undefined) {
        updateData.price = parsed.data.price.toString();
    }
    const [updated] = await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, id))
        .returning();
    if (!updated)
        return res.status(404).json({ message: "المنتج غير موجود" });
    return res.json({ product: updated });
});
/**
 * DELETE /api/products/:id
 * حذف منتج (أدمن فقط)
 */
router.delete("/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
        return res.status(400).json({ message: "معرّف غير صالح" });
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
    if (!deleted)
        return res.status(404).json({ message: "المنتج غير موجود" });
    return res.json({ message: "تم حذف المنتج" });
});
export default router;
