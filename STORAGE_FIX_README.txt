FUTBOL MARKET — SUPABASE STORAGE TUZATISHI

Nima o'zgardi:
- Admin rasm yuklaganda product-images bucket mavjudligi tekshiriladi.
- Bucket yo'q bo'lsa, serverdagi SUPABASE_SERVICE_ROLE_KEY yordamida avtomatik yaratiladi.
- Storage xatosi endi aniq HTTP kodi va Supabase javobi bilan ko'rsatiladi.
- Eski public rasm URL'lari o'zgartirilmaydi.

MUHIM SOZLASH:
1) Vercel -> Project -> Settings -> Environment Variables:
   SUPABASE_URL = Supabase Project URL
   SUPABASE_SERVICE_ROLE_KEY = shu loyihaning server-side Secret/Service Role key'i
   Ikkalasi ham Production va Preview muhitlarida kerak bo'lsa belgilang.
2) Environment Variables o'zgargach Redeploy qiling.
3) Localhost uchun .env.example nusxasini .env deb saqlang va qiymatlarni to'ldiring.
4) Admin panelda orqa rasmni qayta yuklab saqlang.

XAVFSIZLIK:
- .env va .env.local maxfiy kalitlarni o'z ichiga olgani uchun ZIP'ga kiritilmadi.
- Hech qachon SUPABASE_SERVICE_ROLE_KEY ni frontend HTML/JS ichiga qo'ymang.
- Agar eski .env faylingiz boshqalarga ochiq joyga yuklangan bo'lsa, Supabase server key va Telegram bot tokenini yangilang.
