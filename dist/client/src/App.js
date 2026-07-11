import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("div", { style: { fontFamily: "Arial, sans-serif", padding: 40, textAlign: "center" }, children: [_jsx("h1", { children: "Fayiz Shop" }), _jsx("p", { children: "\u062D\u0627\u0644\u0629 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0640 Backend:" }), _jsx("p", { style: { fontWeight: "bold" }, children: status }), _jsx("p", { style: { color: "#888", fontSize: 14 }, children: "\u0647\u0630\u0647 \u0635\u0641\u062D\u0629 \u0627\u062E\u062A\u0628\u0627\u0631 \u0645\u0624\u0642\u062A\u0629 - \u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0646\u0647\u0627\u0626\u064A \u0642\u0627\u062F\u0645 \u0644\u0627\u062D\u0642\u0627\u064B" })] }));
}
