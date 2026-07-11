const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || "wahtwman@gmail.com";
const SENDER_NAME = "Fayiz Shop";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const BREVO_API_URL = "https://api.brevo.com/v3";
async function sendEmail(to, subject, htmlContent) {
    if (!BREVO_API_KEY) {
        const error = "[Brevo] خطأ: BREVO_API_KEY غير موجود في Railway Environment Variables";
        console.error(error);
        return { success: false, error };
    }
    console.log("[Brevo] محاولة إرسال إيميل إلى:", to);
    console.log("[Brevo] Sender Email:", SENDER_EMAIL);
    console.log("[Brevo] API Key length:", BREVO_API_KEY.length);
    try {
        const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": BREVO_API_KEY,
            },
            body: JSON.stringify({
                sender: { name: SENDER_NAME, email: SENDER_EMAIL },
                to: [{ email: to }],
                subject,
                htmlContent,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            console.error("[Brevo] فشل إرسال الإيميل - الحالة:", response.status);
            console.error("[Brevo] تفاصيل الخطأ:", JSON.stringify(data, null, 2));
            return { success: false, error: data };
        }
        console.log("[Brevo] تم إرسال الإيميل بنجاح!");
        return { success: true, data };
    }
    catch (err) {
        console.error("[Brevo] خطأ غير متوقع:", err);
        return { success: false, error: err };
    }
}
export async function sendVerificationEmail(to, token) {
    // إزالة الـ trailing slash من CLIENT_URL لتجنب double slash
    const baseUrl = CLIENT_URL.replace(/\/$/, '');
    const verifyLink = `${baseUrl}/verify?token=${token}`;
    const htmlContent = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2>مرحباً بك في Fayiz Shop 🛍️</h2>
      <p>شكراً لتسجيلك معنا. لتفعيل حسابك رجاءً اضغط على الزر التالي:</p>
      <a href="${verifyLink}"
         style="display:inline-block;background:#4361ee;color:#fff;padding:12px 24px;
                border-radius:8px;text-decoration:none;margin:16px 0;">
        تفعيل الحساب
      </a>
      <p>أو استخدم رمز التفعيل التالي مباشرة:</p>
      <p style="font-size:20px;font-weight:bold;letter-spacing:2px;">${token}</p>
      <p style="color:#666;font-size:13px;">إن لم تقم بإنشاء هذا الحساب، تجاهل هذا الإيميل.</p>
    </div>
  `;
    return sendEmail(to, "تفعيل حسابك في Fayiz Shop", htmlContent);
}
export async function sendOrderStatusEmail(to, orderId, status) {
    const statusLabels = {
        pending: "قيد الانتظار",
        processing: "جاري التجهيز",
        delivered: "تم التوصيل",
        rejected: "مرفوض",
    };
    const htmlContent = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2>تحديث على طلبك 📦</h2>
      <p>تم تحديث حالة طلبك رقم <strong>#${orderId}</strong> إلى:</p>
      <p style="font-size:18px;font-weight:bold;color:#4361ee;">
        ${statusLabels[status] || status}
      </p>
      <p>يمكنك متابعة تفاصيل طلبك من خلال حسابك في Fayiz Shop.</p>
    </div>
  `;
    return sendEmail(to, `تحديث حالة الطلب #${orderId} - Fayiz Shop`, htmlContent);
}
