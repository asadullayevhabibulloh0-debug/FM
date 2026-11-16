FUTBOL MARKET — FIXED 2.0

1) Eng oson: START.bat ni ikki marta bosing.
2) Brauzerda http://localhost:3000 ochiladi.
3) Admin: admin@gmail.com + ADMIN_KEY paroli (.env faylida).

NIMA TUZATILDI:
- Mahsulotlar do‘konda ko‘rinadi.
- Xarid qilish ishlaydi.
- Miqdor tanlash bor.
- Buyurtma serverdagi data.json ga yoziladi.
- Admin buyurtmalarni ko‘radi va har 5 sekundda yangilanadi.
- Admin jami buyurtma, sotilgan dona va umumiy tushumni ko‘radi.
- Buyurtmani Edit qilish: xaridor ismi, miqdor, status va jami summa.
- Buyurtmani o‘chirish.
- Mahsulotni qo‘shish/o‘chirish/Edit qilish.
- Mahsulotlar ham serverga ulanish uchun API tayyor.

MUHIM:
Bu versiya haqiqiy backend bilan ishlaydi. Faqat index.html ni ikki marta bosib ochmang; START.bat orqali ishga tushiring.
Internetdagi boshqa odamlarning buyurtmasini qabul qilish uchun serverni hosting/VPS ga joylashtirish kerak.


=====================================================
TELEGRAM BOT (index.js)
=====================================================
Bot yangi buyurtma tushganda sizga Telegram'da xabar yuboradi:
mijoz, telefon, manzil, xarita, to'lov usuli, mahsulotlar va jami summa.
Xabar tagidagi tugmalar bilan holatni o'zgartirasiz (Yo'lda / Yetkazildi /
Bekor qilish) va u saytdagi admin panelda ham yangilanadi.

SOZLASH (bir marta):
1) Telegram'da @BotFather ga yozing -> /newbot -> nom bering -> TOKEN oling.
2) ".env.example" faylini ".env" deb nusxalang va BOT_TOKEN= ga tokenni yozing.
3) START.bat ni ishga tushiring (yoki: node index.js).
4) O'zingizning botingizga Telegram'da /start yuboring. Bot sizning chat ID
   raqamingizni yozib beradi. Uni .env dagi ADMIN_CHAT_ID= ga yozing va
   START.bat ni qayta ishga tushiring.

BUYRUQLAR: /orders  /new  /stats

ESLATMA:
- Bot ishlashi uchun kompyuter yoqilgan va START.bat ishlab turishi kerak.
- Node.js 18 yoki yangiroq kerak.
- Bot faqat ADMIN_CHAT_ID dagi odamlarga javob beradi.
- BOT_TOKEN yozilmasa sayt avvalgidek ishlayveradi, faqat bot o'chiq bo'ladi.
- Karta raqamining faqat oxirgi 4 raqami saqlanadi.


=====================================================
BOTDA BUYURTMA (Mini App) — KOMPYUTERDA: START.bat
=====================================================
START.bat endi «node telegram-local.js» ni ishga tushiradi:
  1) cloudflared (bepul https tunnel) birinchi marta .tools/ ga yuklanadi
  2) sayt internetda https://....trycloudflare.com manzilida ochiladi
  3) bot ishga tushadi va mijozlar chatidagi «🛒 Do'kon» tugmasi shu manzilga ulanadi
Mijoz botda «🛒 Do'kon» ni bosadi -> mahsulot, o'lcham, savat -> «Buyurtma berish».
Buyurtma data.json ga yoziladi va:
  - admin panelda ko'rinadi: http://localhost:3000/admin.html
  - admin chatiga bot xabari keladi (holat tugmalari bilan); tugma bosilsa admin
    paneldagi holat ham o'zgaradi va mijozga Telegram'da xabar boradi
  - admin panelda holatni o'zgartirsangiz ham bot buni ko'radi
Admin panelda qo'shilgan yangi mahsulot darhol botdagi do'konda ham chiqadi.

Eslatma:
- Tunnel manzili har ishga tushirishda yangi bo'ladi — bot buni o'zi yangilaydi.
- Kompyuter yoki oyna yopilsa bot to'xtaydi. Doimiy ishlashi uchun pastdagi Vercel bo'limi.
- Internetdan /api/orders ro'yxatini ko'rib bo'lmaydi (faqat shu kompyuterdan yoki
  ADMIN_KEY paroli bilan). .env, data.json kabi fayllar internetga berilmaydi.


=====================================================
SAYT + TELEGRAM BOT + MINI APP — VERCEL'DA (kompyuter o'chiq bo'lsa ham ishlaydi)
=====================================================
Bitta Vercel loyiha (bepul) hammasini ishlatadi:
  https://<sayt>.vercel.app/               — sayt (index, login, shop, admin)
  https://<sayt>.vercel.app/telegram-app/  — Telegram Mini App (botdagi «🛒 Do'kon»)
  /api/products  — sayt, Mini App va bot uchun yagona mahsulotlar ro'yxati
  /api/orders    — saytdan va Mini App'dan buyurtma -> bot orqali adminga + admin panelga
  /api/telegram  — bot (Telegram webhook): /start, kategoriyalar, mijoz bilan yozishma

DEPLOY (bir marta) — faqat SIZ deploy qila olasiz:
1) npx vercel login           (o'zingizning Vercel akkauntingiz bilan)
2) npx vercel link            (loyihani akkauntingizga bog'laydi)
3) Vercel Environment Variables (Production) — .env dagi qiymatlar:
     BOT_TOKEN, ADMIN_CHAT_ID, ADMIN_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
   (npx vercel env add <NOM> production — yoki Vercel sayti -> Settings -> Environment Variables)
4) npx vercel deploy --prod
5) node setup-bot.js https://<sayt>.vercel.app   (botni Vercel'ga ulaydi, 24/7)
6) Tavsiya: @BotFather -> /mybots -> bot -> Bot Settings -> Configure Mini App ->
   Enable Mini App -> https://<sayt>.vercel.app/telegram-app/

KEYIN YANGILASH: kodni o'zgartirgach faqat:  npx vercel deploy --prod

KIM DEPLOY QILA OLADI:
- vercel.json da git.deploymentEnabled=false: GitHub'ga push qilinsa ham sayt O'ZGARMAYDI.
  Sayt faqat sizning Vercel akkauntingizdan (npx vercel deploy --prod) yangilanadi.
- Vercel -> Settings -> Members ga hech kimni qo'shmang.
- Maxfiy kalitlar (.env) GitHub'ga ham, Vercel fayllariga ham yuklanmaydi.

Admin panel: https://<sayt>.vercel.app/login.html -> admin@gmail.com + ADMIN_KEY (paroli .env da).
Supabase ulanmasa: buyurtmalar faqat Telegram admin chatiga boradi, mahsulotlar products.json dan.

ESLATMA:
- Webhook yoqilgach START.bat botni kompyuterda ishga tushirmaydi (faqat saytni) —
  ikki joyda bir vaqtda ishlab, bir-birini buzmasligi uchun. Kompyuterdagi saytdan
  tushgan buyurtma xabari ham adminga baribir boradi.
- .env, bot-setup.html, .tools Vercel'ga yuklanmaydi (.vercelignore).


=====================================================
SUPABASE — hamma narsa bitta bazada saqlanadi
=====================================================
Buyurtmalar, mahsulotlar va admin panelda yuklangan rasmlar Supabase'da turadi.
Kompyuterdagi sayt (START.bat) ham, Vercel ham BITTA bazani ishlatadi.

SOZLASH (bir marta):
1) https://supabase.com -> New project (bepul). Parolni eslab qoling.
2) Supabase -> SQL Editor -> New query -> supabase/schema.sql faylini to'liq
   joylang -> Run. (jadvallar, rasm papkasi va 6 ta boshlang'ich mahsulot)
3) Supabase -> Project Settings -> API dan oling:
     Project URL           -> SUPABASE_URL
     service_role / secret -> SUPABASE_SERVICE_ROLE_KEY
4) Shu ikkalasini .env ga (kompyuter uchun) va Vercel Environment Variables ga
   yozing, Vercel'da Redeploy qiling.
5) Eski buyurtmalarni ko'chirish (data.json va eski Upstash Redis'dan):
     npm run db-migrate
   (Redis'dan ham olish uchun .env ga KV_REST_API_URL va KV_REST_API_TOKEN ni
    vaqtincha yozing — Vercel -> Settings -> Environment Variables da bor.)

Tekshirish: START.bat oynasida "baza: Supabase" yozuvi chiqadi.
Supabase -> Table Editor -> orders / products jadvallarida hammasini ko'rasiz.

ESLATMA:
- service_role kaliti maxfiy — faqat .env va Vercel'da turadi, brauzerga berilmaydi.
- Jadvallarda RLS yoqilgan: kalitsiz hech kim baza bilan to'g'ridan-to'g'ri ishlay olmaydi.
- SUPABASE_URL yozilmasa kompyuterda avvalgidek data.json ishlatiladi.


=====================================================
TO'LOV KARTALARI VA UZUM CARD CHEGIRMASI
=====================================================
Buyurtma oynasida: UZCARD, HUMO, UZUM CARD, VISA, Naqd pul.
- Hech qanday pul yechilmaydi/o'tkazilmaydi; CVV va SMS-kod so'ralmaydi.
- Karta raqami (4 tadan bo'lib yoziladi, Luhn va karta turiga mos boshlanishi tekshiriladi) serverga
  yuborilmaydi va bazaga yozilmaydi. Buyurtmada faqat oxirgi 4 raqam saqlanadi.
- UZUM CARD: butun buyurtmadan 20 000 so'm chegirma (bir marta). Boshqalarda 0.
  Chegirma api/_lib.js dagi DISCOUNTS da serverda hisoblanadi (brauzer narxini o'zgartirib bo'lmaydi);
  shop.html dagi hisob faqat ko'rsatish uchun.
- Admin panel: xaridor, mahsulotlar, to'lov kartasi, oxirgi 4 raqam, chegirma, yakuniy summa, holat.
- Supabase ishlatsangiz: supabase/DISCOUNT_MIGRATION.sql ni bir marta Run qiling (orders.discount ustuni).
  Ustun bo'lmasa ham buyurtma yo'qolmaydi, lekin chegirma qiymati saqlanmaydi.
- Karta egasining ismi: api/_cardholder.js + CARD_HOLDER_API_URL / CARD_HOLDER_API_KEY (.env.example).
  API ulanmasa ism ko'rsatilmaydi va tushunarli xabar chiqadi (taxmin/demo ism yo'q).
- Telegram Mini App (telegram-app/) o'zgartirilmagan; u eski "Naqd pul / Karta" qiymatlarini yuboradi va ishlayveradi.
