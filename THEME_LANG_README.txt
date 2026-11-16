YANGILANGAN FUTBOL MARKET

- Saytning barcha asosiy sahifalariga qora/neon-sariq fon qo'shildi.
- Yuqori o'ng burchakdagi UZB / RUS / ENG tanlagich orqali tilni almashtirish mumkin.
- Tanlangan til brauzerda saqlanadi.
- Login, do'kon, admin va bosh sahifaning avvalgi HTML/JS funksiyalari saqlab qolindi.

ISHGA TUSHIRISH:
1. ZIP faylni oching.
2. Papkani VS Code'da oching.
3. README.txt yoki START.bat bo'yicha serverni ishga tushiring.
4. .env fayli xavfsizlik sababli ZIPga kiritilmadi. Telegram bot kerak bo'lsa, .env.example faylidan .env nusxa yarating va o'zingizning BOT_TOKEN hamda sozlamalaringizni kiriting.

Eslatma: tarjima lug'ati asosiy interfeys matnlarini qamrab oladi; admin yoki mahsulotlardan foydalanuvchi kiritgan matnlar avtomatik tarjima qilinmaydi.


=== TIL VA QIDIRUV (yangilandi) ===
- language.js: UZB / RUS / ENG. Tanlagich sahifaning pastki o'ng burchagida (Telegram mini-ilovada tepada).
- Til brauzerda saqlanadi. Bosh sahifa, kirish, do'kon, admin va Telegram mini-ilova tarjima qilinadi.
- Yangi matn tarjimasi: language.js ichidagi RAW ro'yxatiga bitta qator qo'shing:
    o'zbekcha matn ||| русский ||| English
- Do'kon va mini-ilovada qidiruv bor: mahsulot nomi va kategoriya bo'yicha, uchala tilda ham ishlaydi
  (masalan "butsa", "бутсы" yoki "boots" bir xil natija beradi).
- Admin panelda buyurtma va mahsulot qidiruvi avvaldan bor (endi u ham tarjima qilinadi).
- Eslatma: admin qo'shgan yangi mahsulot nomlari avtomatik tarjima qilinmaydi (lug'atga qo'shsangiz tarjima bo'ladi).

=== YANGILANISH: ЎЗ (kirill) va boshqa tillar ===
- UZ (lotin), ÖZ (yangi alifbo), RU, EN — o'zimizning tarjima.
- 🌐 tugmasi: yana 38 til (Türkçe, Қазақша, Тоҷикӣ, العربية, 中文, Español ...) — Google Translate orqali, internet kerak.
  Til qo'shish/olib tashlash: language.js ichidagi G_LANGS ro'yxati.
- Alifbo o'girishida o'zgarmay qoladigan so'zlar (XL, CVV, PNG...): language.js dagi CYR_KEEP.

=== YANGI O'ZBEK ALIFBOSI (ÖZ) ===
- 2026-yil 21-oktabr qonuni: O‘→Ö, G‘→Ğ, Sh→Ş, Ch→Ç. Tugma: ÖZ. UZ — hozirgi lotin.
- Matn lotindan avtomatik o'giriladi (language.js: newLatin). Qidiruv ham yangi harflarda ishlaydi.
