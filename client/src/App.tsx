import { useEffect, useState } from "react";

/**
 * هذه صفحة اختبار مؤقتة فقط للتأكد أن الاتصال بين الواجهة والسيرفر يعمل.
 * التصميم النهائي (UI/UX) لمتجر Fayiz Shop سيتم بناؤه لاحقاً كما اتفقنا.
 */
export default function App() {
  const [status, setStatus] = useState("جارِ الاتصال بالسيرفر...");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => setStatus(`متصل ✅ - ${data.service}`))
      .catch(() => setStatus("تعذّر الاتصال بالسيرفر ❌ - تأكد أن السيرفر يعمل على المنفذ 3000"));
  }, []);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 40, textAlign: "center" }}>
      <h1>Fayiz Shop</h1>
      <p>حالة الاتصال بالـ Backend:</p>
      <p style={{ fontWeight: "bold" }}>{status}</p>
      <p style={{ color: "#888", fontSize: 14 }}>
        هذه صفحة اختبار مؤقتة - التصميم النهائي قادم لاحقاً
      </p>
    </div>
  );
}
