import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { attachUser } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // ضروري لإرسال/استقبال الكوكيز عبر الـ CORS
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(attachUser); // يعبّئ req.user إن وُجدت جلسة صالحة

// ==============================
// المسارات
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Fayiz Shop API" });
});

// معالج أخطاء عام
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ غير متوقع في السيرفر" });
  }
);

app.listen(PORT, () => {
  console.log(`✅ Fayiz Shop API يعمل على http://localhost:${PORT}`);
});
