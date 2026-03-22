# 📘 المرجع التطويري (CONTEXT.md)

هذا الملف يخدم كدليل مرجعي شامل لتسهيل فهم معمارية التطبيق، وكيفية التعديل عليه وتطويره مستقبلاً.

---

## 🚀 الحالة الحالية على الإنتاج

| العنصر | القيمة |
|:---|:---|
| **VPS IP** | `158.220.112.12` |
| **المسار** | `/rahoot` |
| **المنفذ الداخلي** | `3002` |
| **مجلد السيرفر** | `/root/rahoot/` |
| **Container** | `rahoot-app` (يشغّل nginx + socket داخله via supervisor) |
| **الحالة** | ✅ يعمل — http://158.220.112.12/rahoot/ |

---

## ⚙️ بنية النشر (Deployment Architecture)

```
nginx خارجي (host) → port 3002 → Container (rahoot-app)
                                     ├── nginx داخلي (port 3000) → يقدم الـ Static Files
                                     └── socket server (port 3001) → WebSocket
```

**مسارات nginx الخارجي` (/etc/nginx/sites-available/games.conf)`:**
- `= /rahoot` → redirect 301 إلى `/rahoot/` (ضروري لمنع redirect خاطئ من الـ container)  
- `/rahoot` → `proxy_pass http://localhost:3002`
- `/ws` → `proxy_pass http://localhost:3002/ws`

### خطوات النشر عند تعديل الكود (عبر Git):

> **المستودع:** https://github.com/alothaimeen/rahoot.git  
> **السيرفر:** `/root/rahoot/` — تم ربطه بـ git في مارس 2026

```bash
# خطوة 0: التأكد من عدم وجود بيانات سرية (المستودع عام Public)
git status

# خطوة 1: رفع التعديلات إلى GitHub
git add .
git commit -m "Auto-deploy: تحديث تطبيق راهوت"
git push origin main

# خطوة 2: على السيرفر — سحب التعديلات وإعادة بناء الحاوية
ssh root@158.220.112.12 "cd /root/rahoot && git pull origin main && docker compose -f compose.yml build --no-cache && docker compose -f compose.yml down && docker compose -f compose.yml up -d"

# خطوة 3: التحقق من عمل الموقع (النتيجة المطلوبة: STATUS:200)
ssh root@158.220.112.12 'curl -s -o /dev/null -w "STATUS:%{http_code}" http://localhost:3002/'
```

**في حال فشل الموقع:**
```bash
ssh root@158.220.112.12 "docker logs rahoot-app --tail=50"
```

**تحديث سريع (Static Files فقط):**
```bash
git add . && git commit -m "تحديث الواجهة" && git push origin main
ssh root@158.220.112.12 "cd /root/rahoot && git pull origin main && docker compose -f compose.yml restart"
```

### ملاحظة — إعداد السيرفر لأول مرة:
إذا كان مجلد `/root/rahoot/` على السيرفر غير مرتبط بـ git، نفّذ:
```bash
ssh root@158.220.112.12 "cd /root/rahoot && git init && git remote add origin https://github.com/alothaimeen/rahoot.git && git fetch origin && git reset --hard origin/main"
```

---

## 🏗 المعمارية العامة (Architecture)

يتكون مشروع "مسابقة العيد" (بناءً على Rahoot) من مساحات عمل (Workspaces) تعتمد على Pnpm وإدارة الحزم `pnpm-workspace.yaml`، وهي مقسمة إلى التالي:

### 1️⃣ الحزم الأساسية (`packages/`)
- **`web/`**: الواجهة الأمامية (Frontend) مبنية باستخدام **React (Vite)** و **Tailwind CSS**.
  - **المسارات (Routing)**: مُدارة في `src/router.tsx`.
    - `http://localhost:3000/rahoot/`: واجهة تسجيل دخول اللاعبين وإدخال رمز الغرفة.
    - `http://localhost:3000/rahoot/manager/`: واجهة تحكم المدير (تتطلب كلمة مرور: `123`).
    - `http://localhost:3000/rahoot/party/:gameId/`: شاشة اللعب للاعب والمدير.
  - **الاتصال (Socket)**: يستخدم `Socket.io-client` على مسار `/ws`

- **`socket/`**: الخادم الخلفي (Backend) مبني باستخدام **Node.js** و **Socket.io**.
  - **الإدارة (State Management)**: in-memory عبر الكلاس `Game` و `Registry`.
  - **الأحداث (Events)**: `player:join`, `manager:auth`, `manager:startGame`, `player:selectedAnswer`

- **`common/`**: أنواع البيانات المشتركة باستخدام `Zod`

---

## ⚙️ الإعدادات والأسئلة (`config/`)

1. **`game.json`**: إعدادات المسابقة:
   - `managerPassword`: كلمة السر لواجهة manager (الحالية: `123`)
   - `settings.questionTime`: الوقت الافتراضي للسؤال
   - `settings.language`: اللغة الافتراضية

2. **`quizz/`**: ملفات الأسئلة بتصنيفات مستقلة (`.json`)
   - الإجابات مخلوطة تلقائياً لمنع حفظ موضع الخيارات

---

## ✅ التحسينات المنجزة

### جلسة مارس 2026 — التعريب الكامل + إصلاحات الكود

**1. تعريب الواجهة بالكامل (13 تغيير على 12 ملف)**
- `join/Room.tsx`: "PIN Code here" → "أدخل رمز الغرفة"، "Submit" → "دخول"
- `join/Username.tsx`: "Username here" → "أدخل اسمك"، "Submit" → "تأكيد"، "Waiting for the players" → "في انتظار اللاعبين"
- `create/ManagerPassword.tsx`: "Manager password" → "كلمة مرور المدير"، "Submit" → "دخول"
- `states/Answers.tsx`: "Time" → "الوقت"، "Answers" → "الإجابات"
- `states/Result.tsx`: `You are top X, behind Y` → `أنت في المركز X، متأخر عن Y`
- `states/Leaderboard.tsx`: "Leaderboard" → "لوحة المتصدرين"
- `states/Prepared.tsx`: "Question #N" → "السؤال رقم N"
- `states/Room.tsx`: "Join the game at"، "Game PIN:"، "Players Joined:" → عربي
- `utils/constants.ts`: "Start Game"، "Skip"، "Next"، "Waiting for the players" → عربي
- `GameWrapper.tsx`: "Connecting..." → "جارٍ الاتصال..."
- `create/SelectQuizz.tsx`: "Please select a quizz" → "يرجى اختيار مسابقة"
- `pages/.../manager/page.tsx`: "Waiting for the players" → "في انتظار اللاعبين"

**2. إزالة الموسيقى الخلفية (Background Music)**
- حُذفت موسيقى الانتظار (`SFX_ANSWERS_MUSIC`) من `states/Answers.tsx` و `states/Responses.tsx` بالكامل
- تم الاحتفاظ فقط بأصوات التفاعل (SFX) عند الإجابة والفوز والنتائج
- **السبب:** الموسيقى الخلفية المتكررة في بيئة مسابقات جماعية تكون مزعجة

**3. تعطيل أزرار الإجابة بعد الاختيار (UI Fix)**
- `states/Answers.tsx`: أُضيفت حالة `answered` تُعطّل الأزرار بعد الضغط مرة واحدة
- يظهر تأثير بصري (`opacity-50 cursor-not-allowed`) يوضح للاعب أنه أجاب بالفعل
- **السبب:** الكود السابق كان يتجاهل الإجابة المكررة في الـ backend فقط، لكن الـ UI كان مربكاً

**4. تعريب جميع رسائل الخطأ في الـ Backend**
- `common/src/validators/auth.ts`: رسائل التحقق من الاسم ورمز الغرفة باللغة العربية
- `socket/src/utils/game.ts`: "Game not found" → "اللعبة غير موجودة"
- `socket/src/index.ts`: "Game expired"، "Quizz not found"، "Failed to read game config" → عربي
- `socket/src/services/game.ts`: رسائل الطرد، الاتصال المكرر، لا لاعبين → عربي
- **السبب:** هذه الرسائل تظهر للمستخدمين مباشرةً عبر `toast.error()`

**5. حذف كود Debug من الإنتاج**
- `pages/.../manager/page.tsx`: حُذف `console.log("quizzId", quizzId)`

---

## 🛠 المهام المستقبلية المقترحة (Roadmap)

---

## 💡 نصائح برمجية

- **`config/quizz/`**: إضافة تصنيف جديد = إنشاء ملف `.json` فقط (الخادم يقرأه تلقائياً)
- **التشغيل المحلي**: `pnpm run dev` يشغل web + socket معاً
- **Base path**: الـ Vite config مضبوط على `base: '/rahoot'` — لا تغيره وإلا تنكسر الروابط

---

## 🏗 المعمارية العامة (Architecture)

يتكون مشروع "مسابقة العيد" (بناءً على Rahoot) من مساحات عمل (Workspaces) تعتمد على Pnpm وإدارة الحزم `pnpm-workspace.yaml`، وهي مقسمة إلى التالي:

### 1️⃣ الحزم الأساسية (`packages/`)
- **`web/`**: الواجهة الأمامية (Frontend) مبنية باستخدام **React (Vite)** و **Tailwind CSS**.
  - **المسارات (Routing)**: مُدارة في `src/router.tsx`.
    - `http://localhost:3000/`: واجهة تسجيل دخول اللاعبين وإدخال رمز الغرفة.
    - `http://localhost:3000/manager/`: واجهة تحكم المدير (لإنشاء اللعبة والتحكم بالأسئلة)، لا تتطلب كلمة مرور حالياً (تم تجاوزها).
    - `http://localhost:3000/party/:gameId/`: شاشة اللعب سواء للاعب أو المدير حيث يتم عرض الأسئلة والنتائج.
  - **الاتصال (Socket)**: يستخدم `Socket.io-client` للتواصل المباشر مع الخادم للحصول على الأسئلة وإرسال الإجابات.

- **`socket/`**: الخادم الخلفي (Backend) مبني باستخدام **Node.js** و **Socket.io**.
  - **الإدارة (State Management)**: تتم إدارة غرف اللعب واللاعبين والأسئلة مباشرة في ذاكرة الخادم (In-memory) عبر الكلاس `Game` و `Registry`.
  - **الأحداث (Events)**: يعتمد بشكل كامل على أحداث الـ WebSocket مثل (`player:join`, `manager:auth`, `manager:startGame`, `player:selectedAnswer`).

- **`common/`**: أنواع البيانات المشتركة (Shared Types & Validators) المشتركة بين الخادم والواجهة الأمامية باستخدام `Zod` لضمان تطابق البيانات (مثل شكل ملفات الأسئلة `QuizzType`).

---

## ⚙️ الإعدادات والأسئلة (`config/`)

سابقاً كانت جميع الأسئلة توضع داخل `game.json`، لكن تم تطويرها وفصلها للاعتمادية والأداء وأصبحت كالتالي:

1. **`game.json`**: يحتوي على الإعدادات الرئيسية للمسابقة:
   - `managerPassword`: مهمل حالياً (كان يُستخدم ككلمة سر لواجهة manager وتم إلغاء الحاجة إليه لتسريع الدخول).
   - `settings.questionTime`: الوقت الافتراضي للسؤال.
   - `settings.language`: اللغة الافتراضية للعبة.

2. **`quizz/`**: مجلد يحتوي على تصنيفات الأسئلة، كل تصنيف في ملف `.json` مستقل (مثل: `eid-history.json`، `eid-islam.json` إلخ).
   - **الترتيب العشوائي للإجابات:** تم إضافة سكربت ينظم الأسئلة بحيث يتم خلط الإجابات تلقائياً لضمان عدم حفظ اللاعبين لأماكن الإجابات (تحديداً بعد اكتشاف ثغرة الخيار الأول).

---

## 🛠 المهام المستقبلية المقترحة (Roadmap)

تسهيلاً للتطوير في المستقبل، يمكن التركيز على المهام التالية:

### 1. تحسين مظهر الواجهة
   - ألوان العيد قد تم تطبيقها جزئياً في `index.css` باستخدام المتغيرات (CSS Variables).
   - يمكن التعديل على الحركات (Animations) في مكتبة Tailwind من خلال ملف `tailwind.config.js`.
   - **ملاحظة:** مكتبة `framer-motion` وConfetti مُستخدَمتان بالفعل في `Leaderboard.tsx` و `Podium.tsx`.

### 2. إضافة دعم الهاتف المحمول (Mobile Responsiveness)
   - واجهة المدير مصممة بشكل أفضل للأجهزة المكتبية (لأن المدير عادة يعرض اللعبة على شاشة تلفاز أو جهاز عرض).
   - يجب اختبار واجهات التصويت الخاصة باللاعبين (`PlayerGamePage`) للتأكد من سهولة الضغط عليها في أجهزة الجوال.

### 3. ميزات درجة ثانية (للمستقبل البعيد)
   - **أنواع أسئلة جديدة** (صح/خطأ): يتطلب تغيير `Quizz` type في `common/` وتعديل الـ socket backend وإضافة مكونات frontend جديدة
   - **استمرارية النتائج** (قاعدة بيانات): يتطلب استبدال الـ in-memory state في `Registry` بـ Prisma/SQLite

---

## 💡 نصائح برمجية (Best Practices للمشروع)
- **ملفات `.env`**: إذا قمت بإضافة أي مكتبات تتطلب مفاتيح (API Keys)، تأكد من إنشاء ملف `.env` في الجذر. التطبيق مهيأ لقراءته عبر مكتبة `dotenv-cli`.
- **التشغيل أثناء التطوير**: يفضل دائماً استخدام `pnpm run dev` لأنه يشغل واجهة الـ React وخادم الـ Socket في وقت واحد ويتيح (Hot Reloading).
- **إضافة تصنيفات أسئلة**: لست بحاجة لكتابة كود عند إضافة تصنيف جديد، فقط أنشئ ملف `json` داخل مجلد `config/quizz/` وسيقوم خادم Socket بقراءته تلقائياً عند التشغيل.
