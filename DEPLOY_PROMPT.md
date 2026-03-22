# برومبت وكيل الذكاء الاصطناعي: إعادة الرفع لـ Rahoot (Git)

> **أيها الوكيل الذكي:** إذا طلب منك المستخدم "ارفع التعديلات" أو "Deploy"، اتبع هذه الخطوات بحذافيرها لرفع التحديثات إلى السيرفر والتأكد من عملها بسلاسة.

## ⚠️ خطوة 0: حماية البيانات السرية (حرج جداً)
بما أن هذا المستودع **عام (Public)**، يُمنع منعاً باتاً رفع أي معلومات سرية.
- تأكد من عدم احتواء ملفات `config/game.json` على كلمات مرور حساسة جداً أو استبدلها بـ `123` كنموذج تجريبي.
- راجع حالة Git وتأكد من أن ملفات البيئة إن وُجدت مخفية في `.gitignore`.

## خطوة 1: الرفع للمستودع (محلياً)
نفذ الأوامر التالية من داخل مجلد `Rahoot-Arabic-Edition`:

```bash
git status # تأكد من أمان الملفات المضافة
git add .
git commit -m "Auto-deploy: تحديث تطبيق راهوت"
git push origin main
```

## خطوة 2: تحديث السيرفر وبناء الحاوية
اسحب التعديلات في السيرفر وأعد بناء الصورة:

```bash
ssh root@158.220.112.12 "cd /root/rahoot && git pull origin main && docker compose -f compose.yml build --no-cache && docker compose -f compose.yml down && docker compose -f compose.yml up -d"
```

*(ملاحظة للوكيل: إذا كان التعديل فقط في ملفات الواجهة الأمامية Static Files، يمكنك محاولة إعادة التشغيل السريع كالتالي: `ssh root@158.220.112.12 "cd /root/rahoot && git pull origin main && docker compose -f compose.yml restart"`)*

## خطوة 3: التحقق من عمل الموقع بدون أخطاء
انتظر قليلاً ثم تأكد من إقلاع الخادم واستجابته لطلب HTTP:

```bash
ssh root@158.220.112.12 'curl -s -o /dev/null -w "STATUS:%{http_code}" http://localhost:3002/'
```

- **النتيجة المطلوبة:** `STATUS:200`
- **إن لم يكن 200:** تتبع سجل الأخطاء عبر: `ssh root@158.220.112.12 "docker logs rahoot-app --tail=50"` وقم بحل المشكلة.
