-- ==========================================================
-- هذا الملف بديل يدوي مطابق تماماً لملف server/db/schema.ts
-- الطريقة الموصى بها فعلياً هي تشغيل: npm run db:push
-- (سيقوم drizzle-kit بتوليد وتطبيق الميغريشن تلقائياً حسب الـ schema)
-- لكن هذا الملف متاح لو رغبت بالتطبيق اليدوي عبر Neon SQL Editor
-- ==========================================================

CREATE TYPE "order_status" AS ENUM ('pending', 'processing', 'delivered', 'rejected');

CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "is_verified" BOOLEAN NOT NULL DEFAULT false,
  "verification_token" VARCHAR(255),
  "is_admin" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "products" (
  "id" SERIAL PRIMARY KEY,
  "name_ar" VARCHAR(255) NOT NULL,
  "name_en" VARCHAR(255) NOT NULL,
  "description_ar" TEXT,
  "description_en" TEXT,
  "price" NUMERIC(10, 2) NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "image_url" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" "order_status" NOT NULL DEFAULT 'pending',
  "total_price" NUMERIC(10, 2) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" SERIAL PRIMARY KEY,
  "order_id" INTEGER NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "product_id" INTEGER NOT NULL REFERENCES "products"("id"),
  "quantity" INTEGER NOT NULL,
  "price" NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "cart_items" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "product_id" INTEGER NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE ("user_id", "product_id")
);

CREATE INDEX IF NOT EXISTS "idx_orders_user_id" ON "orders" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_order_items_order_id" ON "order_items" ("order_id");
CREATE INDEX IF NOT EXISTS "idx_cart_items_user_id" ON "cart_items" ("user_id");
