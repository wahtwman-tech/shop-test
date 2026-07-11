import { pgTable, serial, text, varchar, boolean, timestamp, integer, numeric, pgEnum, unique, } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
// ==============================
// Enums
// ==============================
export const orderStatusEnum = pgEnum("order_status", [
    "pending",
    "processing",
    "delivered",
    "rejected",
]);
// ==============================
// جدول المستخدمين (users)
// ==============================
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    isVerified: boolean("is_verified").notNull().default(false),
    verificationToken: varchar("verification_token", { length: 255 }),
    // حقل إضافي ضروري لتفعيل صلاحيات لوحة الأدمن (لم يُذكر صراحة لكنه لازم للمتطلب رقم 3)
    isAdmin: boolean("is_admin").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const usersRelations = relations(users, ({ many }) => ({
    orders: many(orders),
    cartItems: many(cartItems),
}));
// ==============================
// جدول المنتجات (products)
// ==============================
export const products = pgTable("products", {
    id: serial("id").primaryKey(),
    nameAr: varchar("name_ar", { length: 255 }).notNull(),
    nameEn: varchar("name_en", { length: 255 }).notNull(),
    descriptionAr: text("description_ar"),
    descriptionEn: text("description_en"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    stock: integer("stock").notNull().default(0),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const productsRelations = relations(products, ({ many }) => ({
    orderItems: many(orderItems),
    cartItems: many(cartItems),
}));
// ==============================
// جدول الطلبات (orders)
// ==============================
export const orders = pgTable("orders", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull().default("pending"),
    totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const ordersRelations = relations(orders, ({ one, many }) => ({
    user: one(users, { fields: [orders.userId], references: [users.id] }),
    items: many(orderItems),
}));
// ==============================
// جدول تفاصيل الطلب (order_items)
// ==============================
export const orderItems = pgTable("order_items", {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id")
        .notNull()
        .references(() => products.id),
    quantity: integer("quantity").notNull(),
    // سعر المنتج وقت الشراء (snapshot) - مهم حتى لو تغير سعر المنتج لاحقاً
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
});
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
    product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
// ==============================
// جدول سلة التسوق الدائمة (cart_items)
// ضروري لتحقيق متطلب "Persistent Cart" في القسم 3
// ==============================
export const cartItems = pgTable("cart_items", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    productId: integer("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    // منع تكرار نفس المنتج مرتين بسلة نفس المستخدم
    userProductUnique: unique().on(table.userId, table.productId),
}));
export const cartItemsRelations = relations(cartItems, ({ one }) => ({
    user: one(users, { fields: [cartItems.userId], references: [users.id] }),
    product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));
