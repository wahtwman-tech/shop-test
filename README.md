# Fayiz Shop — Backend + Database

## ⚠️ تنبيه أمني قبل أي شيء
الـ `DATABASE_URL` و `RESEND_API_KEY` الموجودة في `.env` انكشفت سابقاً في محادثة نصية.
**قبل النشر الفعلي (Production):**
1. اذهب إلى Neon Console → Settings → Reset Password، وحدّث `DATABASE_URL` بالقيمة الجديدة.
2. اذهب إلى Resend Dashboard → API Keys → احذف المفتاح الحالي وأنشئ مفتاحاً جديداً.

## 1) التثبيت
```bash
npm install
```

## 2) تطبيق الـ Schema على قاعدة البيانات
الطريقة الموصى بها (الأسرع والأبسط لبيئة التطوير):
```bash
npm run db:push
```
هذا الأمر يقرأ `server/db/schema.ts` ويطبّق الجداول مباشرة على قاعدة Neon المحددة في `DATABASE_URL`.

بديل: لو تفضل نظام Migrations رسمي (موصى به لبيئة الإنتاج):
```bash
npm run db:generate   # يولّد ملفات migration في مجلد drizzle/
npx drizzle-kit migrate
```

يمكنك أيضاً معاينة قاعدة البيانات بصرياً عبر:
```bash
npm run db:studio
```

## 3) تشغيل المشروع (Backend + Frontend معاً)
```bash
npm run dev
```
- السيرفر (Express API): `http://localhost:3000`
- الواجهة (Vite): `http://localhost:5173`

## 4) إنشاء أول حساب أدمن
لا يوجد endpoint لإنشاء أدمن (لأسباب أمنية - لا يجب أن يكون هذا مفتوحاً للعامة).
بعد تسجيل أي مستخدم وتفعيله، فعّل صلاحية الأدمن يدوياً عبر Neon SQL Editor:
```sql
UPDATE users SET is_admin = true WHERE email = 'your-admin-email@example.com';
```

## ملخص الـ API

### Auth
| Method | Endpoint | الوصف |
|---|---|---|
| POST | `/api/auth/register` | تسجيل حساب جديد + إرسال إيميل تفعيل |
| POST | `/api/auth/verify` | تفعيل الحساب بالرمز `{ token }` |
| POST | `/api/auth/login` | تسجيل الدخول (يفشل إن لم يكن الحساب مفعّلاً) |
| POST | `/api/auth/logout` | تسجيل الخروج |
| GET  | `/api/auth/me` | بيانات المستخدم الحالي من الجلسة |

### Products
| Method | Endpoint | الوصف |
|---|---|---|
| GET | `/api/products` | كل المنتجات (عام) |
| GET | `/api/products/:id` | منتج واحد |
| POST | `/api/products` | إضافة منتج (أدمن) |
| PUT | `/api/products/:id` | تعديل منتج (أدمن) |
| DELETE | `/api/products/:id` | حذف منتج (أدمن) |

### Cart (يتطلب تسجيل دخول)
| Method | Endpoint | الوصف |
|---|---|---|
| GET | `/api/cart` | عرض السلة المحفوظة |
| POST | `/api/cart` | إضافة منتج `{ productId, quantity }` |
| PUT | `/api/cart/:id` | تعديل الكمية `{ quantity }` |
| DELETE | `/api/cart/:id` | حذف عنصر من السلة |

### Orders (يتطلب تسجيل دخول)
| Method | Endpoint | الوصف |
|---|---|---|
| POST | `/api/orders` | إتمام الشراء (يحوّل السلة لطلب) |
| GET | `/api/orders` | أرشيف طلباتي |
| GET | `/api/orders/:id` | تفاصيل طلب واحد |

### Admin (يتطلب `is_admin = true`)
| Method | Endpoint | الوصف |
|---|---|---|
| GET | `/api/admin/orders` | كل الطلبات من كل العملاء |
| PATCH | `/api/admin/orders/:id/status` | تغيير الحالة `{ status }` + إشعار إيميل تلقائي |

## ملاحظات معمارية مهمة
- **الجلسة**: JWT داخل HTTP-only Cookie صالحة 30 يوم — لا حاجة لتسجيل دخول متكرر.
- **الحماية من الشراء بدون تفعيل**: تسجيل الدخول نفسه مرفوض لأي حساب `is_verified = false`، لذلك أي جلسة نشطة تعني تلقائياً أن الحساب مفعّل — وبالتالي كل مسارات السلة والطلبات محمية تلقائياً.
- **جدول إضافي لم يُذكر صراحة بالمواصفات لكنه ضروري**: `cart_items` (لتحقيق متطلب "Persistent Cart")، وحقل `is_admin` على جدول `users` (لتفعيل صلاحيات لوحة التحكم).
- **snapshot السعر**: `order_items.price` يخزّن سعر المنتج وقت الشراء فعلياً، حتى لو تغيّر سعر المنتج لاحقاً في `products`.
