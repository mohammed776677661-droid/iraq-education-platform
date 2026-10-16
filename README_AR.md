# خادم نقاط منصة العراق التعليمية

## إعداد Render
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Environment variables:
  - `ADMIN_KEY`: مفتاح طويل وسري تختاره أنت، ويجب أن يكون نفسه في إعدادات المنصة لدى المسؤول.
  - `OPENAI_API_KEY`: مفتاح API من OpenAI لتفعيل النصائح الذكية (اختياري؛ من دونه لا تعمل ميزة الذكاء الفعلي).
  - `DATA_DIR`: `/var/data` إذا أضفت Persistent Disk إلى Render وركبته على `/var/data`.
- أضف Persistent Disk في Render mounted at `/var/data` حتى تبقى النقاط بعد إعادة تشغيل الخدمة. بدون قرص دائم، ملف البيانات قد يضيع عند إعادة النشر أو إعادة التشغيل.

## المسارات
- `GET /api/health`
- `GET /api/students/:studentId/points`
- `POST /api/admin/students/points` مع `x-admin-key` وJSON `{ "studentId":"...", "points":50 }`
- `GET /api/notifications?studentId=...`
- `POST /api/ai/study-tip` مع `{ "subject":"رياضيات", "problem":"ما أركز" }`

بعد النشر، ضع رابط الخادم الفعلي ومفتاح الإدارة في لوحة الإدارة داخل واجهة المنصة. لا تضع مفتاح OpenAI في HTML.
