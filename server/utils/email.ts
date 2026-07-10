import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Fayiz Shop <onboarding@resend.dev>";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

/**
 * إرسال إيميل تفعيل الحساب عند التسجيل
 */
export async function sendVerificationEmail(to: string, token: string) {
  const verifyLink = `${CLIENT_URL}/verify?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "تفعيل حسابك في Fayiz Shop",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
          <h2>مرحباً بك في Fayiz Shop 🛍️</h2>
          <p>شكراً لتسجيلك معنا. لتفعيل حسابك رجاءً اضغط على الزر التالي:</p>
          <a href="${verifyLink}"
             style="display:inline-block;background:#111;color:#fff;padding:12px 24px;
                    border-radius:8px;text-decoration:none;margin:16px 0;">
            تفعيل الحساب
          </a>
          <p>أو استخدم رمز التفعيل التالي مباشرة:</p>
          <p style="font-size:20px;font-weight:bold;letter-spacing:2px;">${token}</p>
          <p style="color:#666;font-size:13px;">إن لم تقم بإنشاء هذا الحساب، تجاهل هذا الإيميل.</p>
        </div>
      `,
    });

    if (error) {
      console.error("[Resend] فشل إرسال إيميل التفعيل:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("[Resend] خطأ غير متوقع أثناء إرسال الإيميل:", err);
    return { success: false, error: err };
  }
}

/**
 * إشعار العميل بتحديث حالة طلبه
 */
export async function sendOrderStatusEmail(
  to: string,
  orderId: number,
  status: "pending" | "processing" | "delivered" | "rejected"
) {
  const statusLabels: Record<string, string> = {
    pending: "قيد الانتظار",
    processing: "جاري التجهيز",
    delivered: "تم التوصيل",
    rejected: "مرفوض",
  };

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `تحديث حالة الطلب #${orderId} - Fayiz Shop`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
          <h2>تحديث على طلبك 📦</h2>
          <p>تم تحديث حالة طلبك رقم <strong>#${orderId}</strong> إلى:</p>
          <p style="font-size:18px;font-weight:bold;color:#111;">
            ${statusLabels[status] || status}
          </p>
          <p>يمكنك متابعة تفاصيل طلبك من خلال حسابك في Fayiz Shop.</p>
        </div>
      `,
    });

    if (error) {
      console.error("[Resend] فشل إرسال إيميل تحديث الطلب:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("[Resend] خطأ غير متوقع أثناء إرسال الإيميل:", err);
    return { success: false, error: err };
  }
}
