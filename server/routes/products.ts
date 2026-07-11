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
  if (Number.isNaN(id)) return res.status(400).json({ message: "معرّف غير صالح" });

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
  });
  if (!product) return res.status(404).json({ message: "المنتج غير موجود" });
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
 * POST /api/products/seed
 * إضافة منتجات تجريبية (مؤقت - للاختبار فقط)
 */
router.post("/seed", async (_req, res) => {
  const sampleProducts = [
    {
      nameAr: "قميص رجالي كلاسيك",
      nameEn: "Classic Men's Shirt",
      descriptionAr: "قميص رجالي أنيق من القطن الخالص، مناسب للمناسبات واليومي",
      descriptionEn: "Elegant men's cotton shirt, suitable for events and daily use",
      price: "45000",
      stock: 50,
      imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400",
    },
    {
      nameAr: "بنطلون جينز أزرق",
      nameEn: "Blue Jeans",
      descriptionAr: "بنطلون جينز مريح وعصري للرجال",
      descriptionEn: "Comfortable and modern men's jeans",
      price: "65000",
      stock: 30,
      imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
    },
    {
      nameAr: "حذاء رياضي",
      nameEn: "Sports Shoes",
      descriptionAr: "حذاء رياضي خفيف ومريح للرياضة والشراء",
      descriptionEn: "Light and comfortable sports shoes for running and walking",
      price: "85000",
      stock: 25,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    },
    {
      nameAr: "ساعة ذكية",
      nameEn: "Smart Watch",
      descriptionAr: "ساعة ذكية متطورة مع شاشة AMOLED",
      descriptionEn: "Advanced smart watch with AMOLED display",
      price: "150000",
      stock: 15,
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    },
    {
      nameAr: "سماعات لاسلكية",
      nameEn: "Wireless Earbuds",
      descriptionAr: "سماعات لاسلكية بجودة صوت عالية",
      descriptionEn: "Wireless earbuds with high quality sound",
      price: "75000",
      stock: 40,
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400",
    },
  ];

  const added = [];
  for (const p of sampleProducts) {
    const [product] = await db.insert(products).values(p).returning();
    added.push(product);
  }

  return res.json({ message: `تم إضافة ${added.length} منتج`, products: added });
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
  if (Number.isNaN(id)) return res.status(400).json({ message: "معرّف غير صالح" });

  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.errors[0].message });
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price !== undefined) {
    updateData.price = parsed.data.price.toString();
  }

  const [updated] = await db
    .update(products)
    .set(updateData)
    .where(eq(products.id, id))
    .returning();

  if (!updated) return res.status(404).json({ message: "المنتج غير موجود" });
  return res.json({ product: updated });
});

/**
 * DELETE /api/products/:id
 * حذف منتج (أدمن فقط)
 */
router.delete("/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "معرّف غير صالح" });

  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
  if (!deleted) return res.status(404).json({ message: "المنتج غير موجود" });
  return res.json({ message: "تم حذف المنتج" });
});

export default router;
