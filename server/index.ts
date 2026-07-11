import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { attachUser } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "3000");
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

// ==============================
// API Routes
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Fayiz Shop API" });
});

// ==============================
// Serve Frontend (Production)
// ==============================
const distPath = path.join(process.cwd(), "dist/client");
app.use(express.static(distPath));

// Serve index.html for client-side routing
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ==============================
// Error Handler
// ==============================
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
