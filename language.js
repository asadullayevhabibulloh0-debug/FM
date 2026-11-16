/* =====================================================================
   Futbol Market — til tizimi: UZB / RUS / ENG  (+ qidiruv uchun yordamchi)
   - Sahifadagi matn, placeholder, title, alt, aria-label avtomatik tarjima qilinadi.
   - Til brauzerda saqlanadi (localStorage: fm_lang). Asl matn o'zbekcha.
   - Dinamik matnlar (savat, buyurtmalar, xabarlar) ham MutationObserver orqali tarjima qilinadi.
   - Yangi matn qo'shish: pastdagi LUG'AT ga bitta qator qo'shing:  o'zbekcha ||| русский ||| english
   ===================================================================== */
(function () {
  "use strict";

  /* ---------------- LUG'AT:  o'zbekcha ||| русский ||| english ---------------- */
  var RAW = [
    /* --- bosh sahifa --- */
    "FutbolMarket — Futbol uchun eng zo'r bozor ||| FutbolMarket — лучший рынок для футбола ||| FutbolMarket — the best football marketplace",
    "Telegram bot ||| Telegram-бот ||| Telegram bot",
    "Kirish ||| Вход ||| Sign in",
    "Futbol uchun eng zo'r bozor ||| Лучший рынок для футбола ||| The best market for football",
    "Jihozlaning. ||| Экипируйтесь. ||| Gear up.",
    "Ajralib turing. ||| Выделяйтесь. ||| Stand out.",
    "Dunyodagi yetakchi brendlarning original futbol anjomlari. ||| Оригинальная футбольная экипировка ведущих мировых брендов. ||| Original football gear from the world's leading brands.",
    "O'yinchilar uchun. Ishqibozlar uchun. O'yin uchun. ||| Для игроков. Для болельщиков. Для игры. ||| For players. For fans. For the game.",
    "Xarid qilish ||| Купить ||| Shop now",
    "Futbol buyumlari ||| Футбольные товары ||| Football gear",
    "Buyumlarni arzon narxlarga sotib oling ||| Покупайте товары по доступным ценам ||| Buy gear at great prices",
    "Formalar ||| Формы ||| Jerseys",
    "Butsalar ||| Бутсы ||| Boots",
    "To'plar ||| Мячи ||| Balls",
    "Kuboglar ||| Кубки ||| Trophies",
    "Kuboklar ||| Кубки ||| Trophies",
    "Do'konimizdan ||| Из нашего магазина ||| From our store",
    "Javonda turgan haqiqiy mahsulotlar ||| Настоящие товары с наших полок ||| Real products straight from our shelves",
    "Do'konga o'tish ||| Перейти в магазин ||| Go to the store",
    "Do'kon ||| Магазин ||| Store",
    "FutbolMarket 2024/25 uy formasi — 3D ||| Домашняя форма FutbolMarket 2024/25 — 3D ||| FutbolMarket 2024/25 home jersey — 3D",
    "Real Madrid formasi ||| Форма «Реал Мадрид» ||| Real Madrid jersey",
    "Qizil butsa ||| Красные бутсы ||| Red boots",
    "Barcelona formasi ||| Форма «Барселона» ||| Barcelona jersey",
    "Kubok ||| Кубок ||| Trophy",
    "Milan formasi ||| Форма «Милан» ||| Milan jersey",
    "Ko'k butsa ||| Синие бутсы ||| Blue boots",
    "Oltin butsa kubogi ||| Кубок «Золотая бутса» ||| Golden Boot trophy",
    "Arsenal formasi ||| Форма «Арсенал» ||| Arsenal jersey",
    "Pushti butsa ||| Розовые бутсы ||| Pink boots",
    /* --- kirish / ro'yxatdan o'tish --- */
    "Futbol Market — Kirish ||| Futbol Market — Вход ||| Futbol Market — Sign in",
    "Orqaga ||| Назад ||| Back",
    "Ro'yxatdan o'tish ||| Регистрация ||| Sign up",
    "Parol ||| Пароль ||| Password",
    "Emailingiz va parolingiz bilan kiring. Akkaunt bo'lmasa — «Ro'yxatdan o'tish». ||| Войдите с вашим email и паролем. Нет аккаунта — «Регистрация». ||| Sign in with your email and password. No account? Choose “Sign up”.",
    "Ism ||| Имя ||| Name",
    "Akkaunt yaratish ||| Создать аккаунт ||| Create account",
    "Masalan: Asadullayev@gmail.com ||| Например: Asadullayev@gmail.com ||| E.g.: Asadullayev@gmail.com",
    "Parolingiz ||| Ваш пароль ||| Your password",
    "Ismingiz ||| Ваше имя ||| Your name",
    "Kamida 4 ta belgi ||| Минимум 4 символа ||| At least 4 characters",
    "Hisobingizga kiring va xaridni boshlang. ||| Войдите в аккаунт и начните покупки. ||| Sign in to your account and start shopping.",
    "Yangi hisob yarating va xaridni boshlang. ||| Создайте аккаунт и начните покупки. ||| Create an account and start shopping.",
    "Tekshirilmoqda... ||| Проверка... ||| Checking...",
    "Admin paroli noto'g'ri. ||| Неверный пароль администратора. ||| Incorrect admin password.",
    "Parolni kiriting. ||| Введите пароль. ||| Enter your password.",
    "Parol noto'g'ri. ||| Неверный пароль. ||| Incorrect password.",
    "Bu email admin uchun ajratilgan. ||| Этот email зарезервирован для администратора. ||| This email is reserved for the admin.",
    "Bu email allaqachon ro'yxatdan o'tgan. ||| Этот email уже зарегистрирован. ||| This email is already registered.",
    /* --- do'kon --- */
    "Futbol Market — Xarid ||| Futbol Market — Покупки ||| Futbol Market — Shop",
    "Savat ||| Корзина ||| Cart",
    "Chiqish ||| Выйти ||| Log out",
    "Maydondagi uslubingizni ||| Свой стиль на поле ||| Your style on the pitch,",
    "o'zingiz tanlang. ||| выбирайте сами. ||| your way.",
    "Original formalar, butsalar, to'plar va kuboklar. O'lchamingizni tanlang va buyurtma bering. ||| Оригинальная форма, бутсы, мячи и кубки. Выберите размер и оформите заказ. ||| Original jerseys, boots, balls and trophies. Pick your size and place your order.",
    "Katalog ||| Каталог ||| Catalog",
    "Buyurtma ||| Заказ ||| Order",
    "O'lcham / variant ||| Размер / вариант ||| Size / variant",
    "Miqdor ||| Количество ||| Quantity",
    "Formaning orqasiga ism yozdirasizmi? ||| Нанести имя на спину формы? ||| Add a name on the back of the jersey?",
    "Ism va raqamni forma ustiga yozib beramiz: ||| Нанесём имя и номер на форму: ||| We'll print the name and number on the jersey:",
    "(har bir forma uchun). ||| (за каждую форму). ||| (per jersey).",
    "Ha ||| Да ||| Yes",
    "Yo'q ||| Нет ||| No",
    "Davom etish ||| Продолжить ||| Continue",
    "Forma dizayni ||| Дизайн формы ||| Jersey design",
    "Orqa tomoniga nima yozamiz? ||| Что напишем на спине? ||| What should we print on the back?",
    "Ism 12 ta belgigacha, raqam 1–99 oralig'ida. ||| Имя — до 12 символов, номер — от 1 до 99. ||| Name up to 12 characters, number from 1 to 99.",
    "Raqam ||| Номер ||| Number",
    "Saqlash va davom etish ||| Сохранить и продолжить ||| Save and continue",
    "Savatga qo'shamizmi? ||| Добавить в корзину? ||| Add to cart?",
    "Savatga qo'shish ||| Добавить в корзину ||| Add to cart",
    "Yetkazib berish ||| Доставка ||| Delivery",
    "Telefon raqam ||| Номер телефона ||| Phone number",
    "Manzil ||| Адрес ||| Address",
    "Joylashuvimni yuborish ||| Отправить моё местоположение ||| Send my location",
    "To'lov usuli ||| Способ оплаты ||| Payment method",
    "Naqd pul ||| Наличные ||| Cash",
    "Naqd ||| Наличные ||| Cash",
    "Karta ||| Карта ||| Card",
    "Karta raqami ||| Номер карты ||| Card number",
    "Xavfsizlik uchun faqat oxirgi 4 ta raqam saqlanadi. CVV va amal qilish muddati so'ralmaydi. ||| Для безопасности сохраняются только последние 4 цифры. CVV и срок действия не запрашиваются. ||| For security, only the last 4 digits are stored. CVV and expiry date are never requested.",
    "Buyurtmani tasdiqlash ||| Подтвердить заказ ||| Confirm order",
    "Mahsulotlar ||| Товары ||| Products",
    "Mahsulotlar ||| Товары ||| Products",
    "UZUM CARD chegirmasi ||| Скидка UZUM CARD ||| UZUM CARD discount",
    "Yakuniy summa ||| Итоговая сумма ||| Final amount",
    "Qabul qilganda to'lanadi ||| Оплата при получении ||| Pay on receipt",
    "−20 000 so'm ||| −20 000 сум ||| −20 000 UZS",
    "Pul yechilmaydi va o'tkazilmaydi. CVV va SMS-kod so'ralmaydi. Karta raqami saqlanmaydi — buyurtmada faqat oxirgi 4 ta raqam ko'rinadi. To'lov faqat tanlangan usul sifatida qayd qilinadi. ||| Деньги не списываются и не переводятся. CVV и SMS-код не запрашиваются. Номер карты не сохраняется — в заказе видны только последние 4 цифры. Оплата фиксируется только как выбранный способ. ||| No money is charged or transferred. CVV and SMS code are not requested. The card number is not stored — only the last 4 digits appear in the order. Payment is recorded only as the chosen method.",
    "Karta raqami formati to'g'ri ||| Формат номера карты верный ||| Card number format is valid",
    "Karta raqami 16 ta raqamdan iborat bo'lishi kerak. ||| Номер карты должен состоять из 16 цифр. ||| The card number must have 16 digits.",
    "Karta raqami noto'g'ri. Raqamlarni tekshiring. ||| Неверный номер карты. Проверьте цифры. ||| Invalid card number. Check the digits.",
    "To'lov usulini tanlang: UZCARD, HUMO, UZUM CARD, VISA yoki naqd pul. ||| Выберите способ оплаты: UZCARD, HUMO, UZUM CARD, VISA или наличные. ||| Choose a payment method: UZCARD, HUMO, UZUM CARD, VISA or cash.",
    "Karta egasi tekshirilmoqda... ||| Проверка владельца карты... ||| Checking card holder...",
    "Karta egasining ismi ko'rsatilmaydi: bank yoki to'lov provayderi API'si hali ulanmagan. Buyurtmani davom ettirishingiz mumkin. ||| Имя владельца карты не отображается: API банка или платёжного провайдера ещё не подключён. Вы можете продолжить оформление заказа. ||| The card holder name is not shown: the bank or payment provider API is not connected yet. You can continue with your order.",
    "Jami ||| Итого ||| Total",
    "Jami: ||| Итого: ||| Total:",
    "Hammasini sotib olish ||| Купить всё ||| Buy everything",
    "Savatni tozalash ||| Очистить корзину ||| Clear cart",
    "Masalan: Asad ||| Например: Asad ||| E.g.: Asad",
    "Yopish ||| Закрыть ||| Close",
    "Shahar, tuman, ko'cha, uy raqami ||| Город, район, улица, номер дома ||| City, district, street, house number",
    "Futbolchi ||| Футболист ||| Player",
    "Real Madrid Uy Formasi ||| Реал Мадрид — домашняя форма ||| Real Madrid Home Jersey",
    "Real Madrid Mehmon Formasi ||| Реал Мадрид — гостевая форма ||| Real Madrid Away Jersey",
    "Professional Futbol Butsasi ||| Профессиональные футбольные бутсы ||| Professional Football Boots",
    "Match Futbol To'pi ||| Матчевый футбольный мяч ||| Match Football",
    "Chempionlar Kubogi ||| Кубок чемпионов ||| Champions Trophy",
    "Futbol Forma Premium ||| Футбольная форма Premium ||| Football Jersey Premium",
    "Forma ||| Форма ||| Jersey",
    "Butsa ||| Бутсы ||| Boots",
    "To'p ||| Мяч ||| Ball",
    "Boshqa ||| Другое ||| Other",
    "Barchasi ||| Все ||| All",
    "5-razmer ||| Размер 5 ||| Size 5",
    "Standart ||| Стандарт ||| Standard",
    "Mahsulot topilmadi. ||| Товар не найден. ||| Product not found.",
    "Avval o'lchamni tanlang. ||| Сначала выберите размер. ||| Please choose a size first.",
    "HA yoki YO'Q ni tanlang. ||| Выберите ДА или НЕТ. ||| Choose YES or NO.",
    "Ism va 1–99 oralig'idagi raqamni kiriting. ||| Введите имя и номер от 1 до 99. ||| Enter a name and a number from 1 to 99.",
    "Ism va 1–99 oralig'idagi raqamni yozing. ||| Введите имя и номер от 1 до 99. ||| Enter a name and a number from 1 to 99.",
    "O'lcham: ||| Размер: ||| Size:",
    "Miqdor: ||| Количество: ||| Quantity:",
    "Orqa yozuv: ||| Надпись сзади: ||| Back print:",
    "Orqa yozuv: yo'q ||| Надпись сзади: нет ||| Back print: none",
    "Narxi: ||| Цена: ||| Price:",
    "Savatga qo'shildi ✓ ||| Добавлено в корзину ✓ ||| Added to cart ✓",
    "Savat bo'sh ||| Корзина пуста ||| Your cart is empty",
    "Savat bo'sh. ||| Корзина пуста. ||| Your cart is empty.",
    "Katalogdan mahsulot tanlang, ular shu yerda yig'iladi. ||| Выберите товары из каталога — они появятся здесь. ||| Pick products from the catalog and they'll show up here.",
    "Katalogdan mahsulot tanlang. ||| Выберите товар из каталога. ||| Pick a product from the catalog.",
    "Savatdagi hamma narsa o'chirilsinmi? ||| Удалить всё из корзины? ||| Remove everything from the cart?",
    "Buyurtma Admin'ga yuborildi! ⚽ Tez orada qo'ng'iroq qilamiz. ||| Заказ отправлен администратору! ⚽ Скоро мы вам позвоним. ||| Your order was sent to the admin! ⚽ We'll call you soon.",
    "Buyurtma saqlandi, lekin adminga yetib bormadi. Internetni tekshiring. ||| Заказ сохранён, но не дошёл до администратора. Проверьте интернет. ||| Order saved, but it didn't reach the admin. Check your internet.",
    "Brauzer joylashuvni qo'llamaydi. Manzilni yozing. ||| Браузер не поддерживает геолокацию. Введите адрес. ||| Your browser doesn't support geolocation. Please type your address.",
    "Aniqlanmoqda... ||| Определяем... ||| Detecting...",
    "Joylashuv yuborildi ✓ ||| Местоположение отправлено ✓ ||| Location sent ✓",
    "Joylashuv qo'shildi ✓ ||| Местоположение добавлено ✓ ||| Location added ✓",
    "Manzil aniqlanmoqda... ||| Определяем адрес... ||| Detecting address...",
    "Joylashuvga ruxsat berilmadi. Manzilni yozib qoldiring. ||| Доступ к геолокации не разрешён. Введите адрес вручную. ||| Location access denied. Please type your address.",
    "Telefon raqamni to'liq kiriting: +998 90 123 45 67 ||| Введите номер телефона полностью: +998 90 123 45 67 ||| Enter the full phone number: +998 90 123 45 67",
    "Telefon raqamni to'liq yozing: +998 90 123 45 67 ||| Введите номер телефона полностью: +998 90 123 45 67 ||| Enter the full phone number: +998 90 123 45 67",
    "Manzilni yozing yoki joylashuvingizni yuboring. ||| Введите адрес или отправьте местоположение. ||| Type your address or send your location.",
    "Manzilni yozing yoki joylashuvni aniqlang. ||| Введите адрес или определите местоположение. ||| Type your address or detect your location.",
    "To'lov usulini tanlang: naqd yoki karta. ||| Выберите способ оплаты: наличные или карта. ||| Choose a payment method: cash or card.",
    "To'lov usulini tanlang. ||| Выберите способ оплаты. ||| Choose a payment method.",
    "Karta raqami noto'g'ri. 16 ta raqamni tekshiring. ||| Неверный номер карты. Проверьте 16 цифр. ||| Invalid card number. Check all 16 digits.",
    "Kamaytirish ||| Уменьшить ||| Decrease",
    "Ko'paytirish ||| Увеличить ||| Increase",
    "O'chirish ||| Удалить ||| Delete",
    /* --- qidiruv --- */
    "Qidirish: forma, butsa, to'p... ||| Поиск: форма, бутсы, мяч... ||| Search: jersey, boots, ball...",
    "Qidirish ||| Поиск ||| Search",
    "Tozalash ||| Очистить ||| Clear",
    "Hech narsa topilmadi ||| Ничего не найдено ||| Nothing found",
    "Boshqa so'z bilan qidirib ko'ring. ||| Попробуйте другое слово. ||| Try a different search.",
    /* --- admin --- */
    "Futbol Market — Admin ||| Futbol Market — Админ ||| Futbol Market — Admin",
    "Buyurtmalar ||| Заказы ||| Orders",
    "Bot ||| Бот ||| Bot",
    "Sayt va Telegram'dan tushgan buyurtmalar. Holatni o'zgartirsangiz, Telegram mijozga xabar boradi. ||| Заказы с сайта и из Telegram. При смене статуса клиент получит сообщение в Telegram. ||| Orders from the website and Telegram. When you change the status, the customer gets a Telegram message.",
    "Yangilash ||| Обновить ||| Refresh",
    "Yangi buyurtmalar ||| Новые заказы ||| New orders",
    "Jami buyurtmalar ||| Всего заказов ||| Total orders",
    "Sotilgan dona ||| Продано штук ||| Items sold",
    "Tushum (bekorlarsiz) ||| Выручка (без отменённых) ||| Revenue (excl. cancelled)",
    "Bu yerdagi o'zgarishlar darhol saytda, Telegram do'konda va botda ko'rinadi. ||| Изменения здесь сразу появятся на сайте, в Telegram-магазине и в боте. ||| Changes here appear instantly on the website, the Telegram store and the bot.",
    "Yangi mahsulot ||| Новый товар ||| New product",
    "Rasm tanlash ||| Выбрать фото ||| Choose image",
    "PNG/JPG/WEBP. Katta rasm avtomatik kichraytiriladi. ||| PNG/JPG/WEBP. Большие изображения уменьшаются автоматически. ||| PNG/JPG/WEBP. Large images are shrunk automatically.",
    "Nomi ||| Название ||| Name",
    "Kategoriya ||| Категория ||| Category",
    "Narxi (so'm) ||| Цена (сум) ||| Price (UZS)",
    "O'lchamlar (vergul bilan) ||| Размеры (через запятую) ||| Sizes (comma-separated)",
    "Forma orqasiga ism va raqam yozdirish mumkin (+50 000 so'm) ||| Можно нанести имя и номер на спину формы (+50 000 сум) ||| Name and number can be printed on the back (+50 000 UZS)",
    "Bekor@button ||| Отмена ||| Cancel",
    "Bekor ||| Отменён ||| Cancelled",
    "Saqlash ||| Сохранить ||| Save",
    "Mijoz ismi ||| Имя клиента ||| Customer name",
    "Telefon ||| Телефон ||| Phone",
    "Holat ||| Статус ||| Status",
    "Do'konni ochish ||| Открыть магазин ||| Open store",
    "Ism, telefon, mahsulot yoki #raqam... ||| Имя, телефон, товар или #номер... ||| Name, phone, product or #number...",
    "Mahsulot nomi... ||| Название товара... ||| Product name...",
    "Masalan: Barcelona Uy Formasi ||| Например: Barcelona, домашняя форма ||| E.g.: Barcelona Home Jersey",
    "S, M, L, XL yoki 39, 40, 41 ||| S, M, L, XL или 39, 40, 41 ||| S, M, L, XL or 39, 40, 41",
    "Yangi ||| Новый ||| New",
    "Tayyorlanmoqda ||| Готовится ||| Preparing",
    "Yetkazilmoqda ||| Доставляется ||| Out for delivery",
    "Yetkazildi ||| Доставлен ||| Delivered",
    "Hammasi ||| Все ||| All",
    "Admin paroli kerak ||| Нужен пароль администратора ||| Admin password required",
    "Mahsulotlarni yuklab bo'lmadi ||| Не удалось загрузить товары ||| Couldn't load products",
    "O'chirildi ||| Удалено ||| Deleted",
    "Saqlandi ||| Сохранено ||| Saved",
    "Yangilandi ||| Обновлено ||| Refreshed",
    "Mahsulotni tahrirlash ||| Редактировать товар ||| Edit product",
    "Rasmni o'qib bo'lmadi ||| Не удалось прочитать изображение ||| Couldn't read the image",
    "Nomi, narx va o'lchamlarni kiriting. ||| Введите название, цену и размеры. ||| Enter the name, price and sizes.",
    "Rasm yuklanmoqda... ||| Загрузка изображения... ||| Uploading image...",
    "Mahsulot saqlandi ||| Товар сохранён ||| Product saved",
    "Mahsulot qo'shildi ||| Товар добавлен ||| Product added",
    "Mijoz ||| Клиент ||| Customer",
    "Sayt ||| Сайт ||| Website",
    "Xaritada ochish ||| Открыть на карте ||| Open on map",
    "Tahrirlash ||| Редактировать ||| Edit",
    "Bu filtr bo'yicha buyurtma yo'q. ||| По этому фильтру заказов нет. ||| No orders match this filter.",
    "Hozircha buyurtma yo'q. Mijoz buyurtma bersa shu yerda chiqadi. ||| Заказов пока нет. Новые заказы появятся здесь. ||| No orders yet. New orders will appear here.",
    /* --- Telegram mini-ilova --- */
    "Saytimiz ||| Наш сайт ||| Our website",
    "· Savol bormi? ||| · Есть вопрос? ||| · Questions?",
    "Admin bilan bog'lanish ||| Связаться с админом ||| Contact the admin",
    "Telegramdan ||| Из Telegram ||| From Telegram",
    "Joylashuvimni aniqlash ||| Определить моё местоположение ||| Detect my location",
    "Izoh ||| Комментарий ||| Note",
    "(ixtiyoriy) ||| (по желанию) ||| (optional)",
    "Buyurtma tayyor ||| Заказ готов ||| Order ready",
    "Admin chatida ||| В чате с админом нажмите ||| In the admin chat press",
    "Yuborish ||| «Отправить» ||| Send",
    "tugmasini bosing — shunda buyurtma qabul qilinadi. ||| — тогда заказ будет принят. ||| — then your order will be accepted.",
    "Adminga yuborish ||| Отправить админу ||| Send to admin",
    "Matnni nusxalash ||| Скопировать текст ||| Copy text",
    "Do'konga qaytish ||| Вернуться в магазин ||| Back to the store",
    "Buyurtmalarim ||| Мои заказы ||| My orders",
    "O'lcham ||| Размер ||| Size",
    "Orqasiga ism va raqam yozish ||| Имя и номер на спине ||| Name and number on the back",
    "Kategoriyalar ||| Категории ||| Categories",
    "Ism Familiya ||| Имя Фамилия ||| First and last name",
    "Masalan: 18:00 dan keyin ||| Например: после 18:00 ||| E.g.: after 6 PM",
    "Admin tez orada qo'ng'iroq qiladi. Holat o'zgarsa bot sizga xabar yuboradi. ||| Админ скоро позвонит. Если статус изменится, бот напишет вам. ||| The admin will call you soon. The bot will message you if the status changes.",
    "Nusxalandi ✓ ||| Скопировано ✓ ||| Copied ✓",
    "Matnni belgilab nusxalang ||| Выделите текст и скопируйте ||| Select the text and copy it",
    "Hali buyurtma yo'q ||| Заказов пока нет ||| No orders yet",
    "Birinchi buyurtmangiz shu yerda ko'rinadi. ||| Ваш первый заказ появится здесь. ||| Your first order will show up here."
  ].join("\n");

  /* Qisman almashtiriladigan so'zlar (jumla ichida):  uz ||| ru ||| en */
  var TOKENS_RAW = [
    "Savatga qo'shish ||| Добавить в корзину ||| Add to cart",
    "Rasmiylashtirish ||| Оформить ||| Checkout",
    "Buyurtma berish ||| Заказать ||| Place order",
    "ta mahsulot ||| шт. ||| items",
    "yetkazib berish ||| доставка ||| delivery",
    "O'lcham: ||| Размер: ||| Size:",
    "Joylashuv: ||| Местоположение: ||| Location:",
    "Miqdor: ||| Количество: ||| Quantity:",
    "Narxi: ||| Цена: ||| Price:",
    "Jami: ||| Итого: ||| Total:",
    "jami ||| итого ||| total",
    "so'm ||| сум ||| UZS",
    "dona ||| шт. ||| pcs"
  ];

  /* ---------------- yordamchilar ---------------- */
  var LANGS = ["uz", "uzn", "ru", "en"];
  var norm = function (s) {
    return String(s).replace(/[\u2018\u2019\u02BB\u02BC`\u00B4]/g, "'").replace(/\s+/g, " ").trim();
  };
  var D = {};
  RAW.split("\n").forEach(function (line) {
    var p = line.split(" ||| ");
    if (p.length < 3) return;
    D[norm(p[0]).toLowerCase()] = { ru: p[1].trim(), en: p[2].trim() };
  });

  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  var TOKENS = TOKENS_RAW.map(function (line) {
    var p = line.split(" ||| ");
    var src = norm(p[0]);
    var body = esc(src).replace(/'/g, "['\u2018\u2019\u02BB\u02BC`\u00B4]");
    var re;
    try { re = new RegExp("(^|[^\\p{L}\\p{N}])(" + body + ")(?![\\p{L}\\p{N}'])", "giu"); }
    catch (e) { re = new RegExp("(^|[^A-Za-z0-9\\u0400-\\u04FF])(" + body + ")(?![A-Za-z0-9\\u0400-\\u04FF'])", "gi"); }
    return { re: re, ru: p[1].trim(), en: p[2].trim(), len: src.length };
  }).sort(function (a, b) { return b.len - a.len; });

  function applyTokens(str, lang) {
    var out = str;
    TOKENS.forEach(function (t) {
      t.re.lastIndex = 0;
      out = out.replace(t.re, function (m, pre, word) {
        var rep = t[lang];
        if (/^[A-ZА-Я]/.test(word) && rep) rep = rep.charAt(0).toUpperCase() + rep.slice(1);
        return pre + rep;
      });
    });
    return out;
  }

  var STATUS = {
    "yangi": ["Новый", "New"], "tayyorlanmoqda": ["Готовится", "Preparing"],
    "yetkazilmoqda": ["Доставляется", "Out for delivery"], "yetkazildi": ["Доставлен", "Delivered"],
    "bekor": ["Отменён", "Cancelled"]
  };
  /* Jumla shablonlari (o'zgaruvchan qismi bor matnlar) */
  var PATTERNS = [
    [/^Salom, (.+)$/, function (m, l) { return (l === "ru" ? "Привет, " : "Hello, ") + m[1]; }],
    [/^#(.+?) buyurtmani butunlay o'chirasizmi\?$/, function (m, l) {
      return l === "ru" ? "Удалить заказ #" + m[1] + " полностью?" : "Delete order #" + m[1] + " permanently?"; }],
    [/^«(.+)» mahsulotini o'chirasizmi\? U saytdan va botdan ham yo'qoladi\.$/, function (m, l) {
      return l === "ru" ? "Удалить товар «" + m[1] + "»? Он исчезнет с сайта и из бота."
                        : "Delete the product “" + m[1] + "”? It will also disappear from the website and the bot."; }],
    [/^Holat: (Yangi|Tayyorlanmoqda|Yetkazilmoqda|Yetkazildi|Bekor)( — mijozga xabar yuborildi)?$/i, function (m, l) {
      var st = STATUS[m[1].toLowerCase()][l === "ru" ? 0 : 1];
      var tail = m[2] ? (l === "ru" ? " — клиенту отправлено сообщение" : " — customer notified") : "";
      return (l === "ru" ? "Статус: " : "Status: ") + st + tail; }],
    [/^Savat · (\d+) ta · (.+)$/, function (m, l) {
      return (l === "ru" ? "Корзина · " + m[1] + " шт. · " : "Cart · " + m[1] + " items · ") + applyTokens(m[2], l); }]
  ];

  function isUpper(s) {
    var letters = s.replace(/[^A-Za-zА-Яа-я]/g, "");
    return letters.length >= 2 && s === s.toUpperCase() && s !== s.toLowerCase();
  }

  function core(text, lang, tag) {
    var n = norm(text), key = n.toLowerCase();
    var e = D[key + "@" + tag] || D[key];
    if (e) { var r = e[lang]; return isUpper(text) ? r.toUpperCase() : r; }
    for (var i = 0; i < PATTERNS.length; i++) {
      var m = PATTERNS[i][0].exec(n);
      if (m) return PATTERNS[i][1](m, lang);
    }
    return applyTokens(text, lang);
  }

    var APOS_RE = /['\u2018\u2019\u02BB\u02BC`\u00B4]/;
  var CYR_KEEP = { XS:1, S:1, M:1, L:1, XL:1, XXL:1, XXXL:1, CVV:1, PNG:1, JPG:1, WEBP:1, UZS:1, FM:1, SMS:1, OK:1, USD:1 };
  /* ---------------- Yangi o'zbek alifbosi (2026): O‘→Ö, G‘→Ğ, Sh→Ş, Ch→Ç ---------------- */
  function newWord(w) {
    var out = "", i = 0, n = w.length;
    while (i < n) {
      var c = w.charAt(i), l = c.toLowerCase(), nx = w.charAt(i + 1), nl = nx.toLowerCase(), up = c !== l;
      if ((l === "o" || l === "g") && nx && APOS_RE.test(nx)) { var r = l === "o" ? "ö" : "ğ"; out += up ? r.toUpperCase() : r; i += 2; continue; }
      if (l === "s" && nl === "h") { out += up ? "Ş" : "ş"; i += 2; continue; }
      if (l === "c" && nl === "h") { out += up ? "Ç" : "ç"; i += 2; continue; }
      out += c; i++;
    }
    return out;
  }
  function mapWords(src, conv) {
    return String(src).replace(/\S+/g, function (piece) {
      if (/[@#_\/\\]|\d[A-Za-z]|[A-Za-z]\d|https?:/.test(piece)) return piece;
      return piece.replace(/[A-Za-z\u2018\u2019\u02BB\u02BC`\u00B4']+/g, function (run) {
        var lead = /^['\u2018\u2019\u02BB\u02BC`\u00B4]+/.exec(run), trail = /['\u2018\u2019\u02BB\u02BC`\u00B4]+$/.exec(run);
        var body = run.slice(lead ? lead[0].length : 0, run.length - (trail ? trail[0].length : 0));
        if (!body || CYR_KEEP[body]) return run;
        return (lead ? lead[0] : "") + conv(body) + (trail ? trail[0] : "");
      });
    });
  }
  function newLatin(src) { return mapWords(src, newWord); }

  function tr(src, lang, tag) {
    if (lang === "uz" || typeof src !== "string") return src;
    if (lang === "uzn") return newLatin(src);
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(src);
    if (!m[2]) return src;
    var t = core(m[2], lang, (tag || "").toLowerCase());
    return t === m[2] ? src : m[1] + t + m[3];
  }

  /* ---------------- til holati ---------------- */
  var lang = "uz";
  try { var saved = localStorage.getItem("fm_lang"); if (LANGS.indexOf(saved) > -1) lang = saved; } catch (e) {}

  /* ---------------- DOM tarjimasi ---------------- */
  var ATTRS = ["placeholder", "title", "aria-label", "alt"];
  var SKIP = "script,style,noscript,textarea,#orderText,[data-no-i18n],.fm-language,[contenteditable='true']";
  var origText = new WeakMap(), lastText = new WeakMap(), origAttr = new WeakMap(), lastAttr = new WeakMap();

  function skipped(node) {
    var el = node.nodeType === 3 ? node.parentElement : node;
    return !el || !el.closest || !!el.closest(SKIP);
  }
  function doText(n) {
    if (skipped(n)) return;
    var cur = n.nodeValue;
    if (lastText.get(n) !== cur) origText.set(n, cur);       // yangi yoki skript o'zgartirgan matn
    var orig = origText.get(n);
    var tag = n.parentElement ? n.parentElement.tagName : "";
    var out = lang === "uz" ? orig : tr(orig, lang, tag);
    lastText.set(n, out);
    if (out !== cur) n.nodeValue = out;
  }
  function doAttrs(el) {
    if (!el.getAttribute || (el.closest && el.closest("#orderText,[data-no-i18n],.fm-language"))) return;
    var o = origAttr.get(el), l = lastAttr.get(el);
    ATTRS.forEach(function (a) {
      if (!el.hasAttribute(a)) return;
      var cur = el.getAttribute(a);
      if (!o) { o = {}; origAttr.set(el, o); }
      if (!l) { l = {}; lastAttr.set(el, l); }
      if (l[a] !== cur) o[a] = cur;
      var out = lang === "uz" ? o[a] : tr(o[a], lang, "");
      l[a] = out;
      if (out !== cur) el.setAttribute(a, out);
    });
  }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    if (root.closest && root.closest(".fm-language")) return;
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n;
    while ((n = tw.nextNode())) doText(n);
    doAttrs(root);
    var els = root.querySelectorAll("[placeholder],[title],[aria-label],[alt]");
    for (var i = 0; i < els.length; i++) doAttrs(els[i]);
  }

  var observer = null;
  function observe() {
    if (observer || !window.MutationObserver) return;
    observer = new MutationObserver(function (list) {
      list.forEach(function (m) {
        if (m.type === "characterData") doText(m.target);
        else if (m.type === "attributes") doAttrs(m.target);
        else m.addedNodes.forEach(walk);
      });
    });
    observer.observe(document.documentElement, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ATTRS
    });
  }

  function setLang(l) {
    if (LANGS.indexOf(l) < 0) return;
    lang = l;
    try { localStorage.setItem("fm_lang", l); } catch (e) {}
    document.documentElement.lang = l === "uzn" ? "uz" : l;
    walk(document.documentElement);
    syncSwitcher();
    try { window.dispatchEvent(new CustomEvent("fm-lang-change", { detail: l })); } catch (e) {}
  }

  /* alert / confirm / prompt ham tarjima qilinadi */
  ["alert", "confirm", "prompt"].forEach(function (k) {
    var orig = window[k];
    if (typeof orig !== "function") return;
    window[k] = function () {
      var a = Array.prototype.slice.call(arguments);
      if (typeof a[0] === "string") a[0] = tr(a[0], lang, "");
      return orig.apply(window, a);
    };
  });

  /* ---------------- til tanlagich ---------------- */
  /* Boshqa tillar: Google Translate orqali (sahifa o'zbekchadan tarjima qilinadi) */
  var G_LANGS = [
    ["tr","Türkçe"],["kk","Қазақша"],["tg","Тоҷикӣ"],["ky","Кыргызча"],["tk","Türkmençe"],["az","Azərbaycanca"],
    ["uk","Українська"],["ar","العربية"],["fa","فارسی"],["he","עברית"],["ur","اردو"],["hi","हिन्दी"],["bn","বাংলা"],
    ["zh-CN","中文 (简体)"],["zh-TW","中文 (繁體)"],["ja","日本語"],["ko","한국어"],["vi","Tiếng Việt"],["th","ไทย"],["id","Indonesia"],
    ["es","Español"],["fr","Français"],["de","Deutsch"],["it","Italiano"],["pt","Português"],["nl","Nederlands"],["pl","Polski"],
    ["cs","Čeština"],["ro","Română"],["el","Ελληνικά"],["sv","Svenska"],["hu","Magyar"],["bg","Български"],["sr","Српски"],
    ["ka","ქართული"],["hy","Հայերեն"],["mn","Монгол"],["ps","پښتو"]
  ];
  var gcode = "";
  (function () {
    var m = /(?:^|;\s*)googtrans=\/[^\/;]*\/([^;]+)/.exec(document.cookie || "");
    if (m && m[1]) { gcode = decodeURIComponent(m[1]); lang = "uz"; }
  })();

  function setCookie(value, expire) {
    var base = "googtrans=" + value + ";path=/;" + (expire ? "expires=Thu, 01 Jan 1970 00:00:00 GMT;" : "");
    document.cookie = base;
    var h = location.hostname;
    if (h.indexOf(".") > -1) { document.cookie = base + "domain=" + h + ";"; document.cookie = base + "domain=." + h + ";"; }
  }
  function setGoogle(code) {
    try { localStorage.setItem("fm_lang", "uz"); } catch (e) {}
    if (code) setCookie("/uz/" + code, false); else setCookie("", true);
    location.reload();
  }
  function loadGoogle() {
    window.fmGoogleInit = function () {
      try { new window.google.translate.TranslateElement({ pageLanguage: "uz", autoDisplay: false }, "fm_gt"); } catch (e) {}
    };
    var box = document.createElement("div");
    box.id = "fm_gt"; box.setAttribute("translate", "no");
    box.style.cssText = "position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden";
    document.body.appendChild(box);
    var sc = document.createElement("script");
    sc.src = "https://translate.google.com/translate_a/element.js?cb=fmGoogleInit";
    sc.async = true;
    document.head.appendChild(sc);
  }

  function injectStyle() {
    if (document.getElementById("fmLangStyle")) return;
    var st = document.createElement("style");
    st.id = "fmLangStyle";
    st.textContent =
      ".fm-language{--w:40px;--h:32px;position:fixed!important;z-index:2147483000;right:14px!important;left:auto!important;top:auto!important;bottom:14px!important;" +
      "display:inline-flex;align-items:center;padding:4px;border-radius:999px;color:#fff;" +
      "background:linear-gradient(135deg,rgba(18,24,12,.92),rgba(4,6,4,.96));border:1px solid rgba(217,255,0,.45);" +
      "box-shadow:0 0 0 1px rgba(0,0,0,.4),0 8px 24px rgba(0,0,0,.45),0 0 18px rgba(217,255,0,.18);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);" +
      "font:800 12px/1 Archivo,Arial,sans-serif;letter-spacing:.06em;user-select:none;transition:box-shadow .25s,border-color .25s}" +
      ".fm-language:hover{border-color:#d9ff00;box-shadow:0 0 0 1px rgba(0,0,0,.4),0 8px 24px rgba(0,0,0,.45),0 0 26px rgba(217,255,0,.35)}" +
      ".fm-seg{position:relative;display:flex;border-radius:999px;background:rgba(255,255,255,.07);box-shadow:inset 0 1px 3px rgba(0,0,0,.5)}" +
      ".fm-thumb{position:absolute;left:0;top:0;width:var(--w);height:var(--h);border-radius:999px;" +
      "background:linear-gradient(135deg,#eaff4a,#b6e600);box-shadow:0 0 14px rgba(217,255,0,.7),inset 0 1px 0 rgba(255,255,255,.6);" +
      "transform:translateX(calc(var(--i,0)*var(--w)));transition:transform .35s cubic-bezier(.34,1.56,.64,1);opacity:1}" +
      ".fm-language.none .fm-thumb{opacity:0}" +
      ".fm-seg button{position:relative;z-index:1;width:var(--w);height:var(--h);padding:0;border:0;border-radius:999px;background:transparent;" +
      "color:rgba(255,255,255,.72);font:inherit;letter-spacing:inherit;cursor:pointer;transition:color .2s,transform .15s;display:flex;align-items:center;justify-content:center}" +
      ".fm-seg button:hover{color:#fff}.fm-seg button:active{transform:scale(.92)}" +
      ".fm-seg button.on{color:#0a0d05}" +
      ".fm-seg button:focus-visible{outline:2px solid #d9ff00;outline-offset:2px}" +
      ".fm-more svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round}" +
      ".fm-more.on svg{animation:none}.fm-more:not(.on) svg{animation:fmSpin 14s linear infinite}" +
      "@keyframes fmSpin{to{transform:rotate(360deg)}}" +
      ".fm-more .code{display:none}.fm-more.g .code{display:inline}.fm-more.g svg{display:none}" +
      ".fm-pop{position:absolute;right:0;top:calc(100% + 10px);z-index:5;width:min(300px,86vw);max-height:min(62vh,420px);overflow:auto;padding:10px;border-radius:16px;" +
      "background:rgba(8,11,6,.97);border:1px solid rgba(217,255,0,.4);box-shadow:0 18px 50px rgba(0,0,0,.65),0 0 24px rgba(217,255,0,.15);" +
      "letter-spacing:0;font-weight:600;animation:fmPop .18s ease-out}" +
      ".fm-language:not(.inline) .fm-pop{top:auto;bottom:calc(100% + 10px)}" +
      "@keyframes fmPop{from{opacity:0;transform:translateY(-6px) scale(.97)}to{opacity:1;transform:none}}" +
      ".fm-pop[hidden]{display:none}" +
      ".fm-pop h4{margin:2px 6px 8px;font:800 11px Archivo,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#d9ff00}" +
      ".fm-pop .grid{display:grid;grid-template-columns:1fr 1fr;gap:4px}" +
      ".fm-pop button{padding:9px 10px;border:0;border-radius:10px;background:rgba(255,255,255,.05);color:#f1f4ec;font:600 13px Archivo,Arial,sans-serif;text-align:left;cursor:pointer;transition:background .15s,color .15s}" +
      ".fm-pop button:hover{background:rgba(217,255,0,.16);color:#fff}" +
      ".fm-pop button.on{background:#d9ff00;color:#0a0d05}" +
      ".fm-pop small{display:block;margin:8px 6px 2px;color:#8a9285;font:500 11px Archivo,Arial,sans-serif;line-height:1.35}" +
      ".fm-language.inline{position:relative!important;margin:0}" +
      "[data-lang-slot]{display:flex;justify-content:flex-end;padding:6px 0 0}" +
      "[data-lang-slot=header]{display:inline-flex;padding:0;align-items:center}" +
      "[data-lang-slot=header] .fm-language{--w:34px;--h:28px;padding:3px;font-size:11px;box-shadow:0 0 14px rgba(217,255,0,.15)}" +
      "@media(max-width:640px){.fm-language{--w:32px;--h:28px}.fm-language:not(.inline){right:10px!important;bottom:10px!important}" +
      "[data-lang-slot=header] .fm-language{--w:28px;--h:26px;font-size:10px}}" +
      "@media(prefers-reduced-motion:reduce){.fm-more svg{animation:none!important}.fm-thumb{transition:none}}" +
      /* Google Translate yozuvlari va yuqori panelini yashirish */
      "body{top:0!important;position:static!important}.skiptranslate>iframe,iframe.skiptranslate,#goog-gt-tt,.goog-te-balloon-frame,.goog-tooltip{display:none!important}" +
      ".goog-text-highlight{background:none!important;box-shadow:none!important}";
    document.head.appendChild(st);
  }
  function syncSwitcher() {
    var box = document.querySelector(".fm-language");
    if (!box) return;
    var i = gcode ? LANGS.length : LANGS.indexOf(lang);
    box.style.setProperty("--i", i);
    box.classList.toggle("none", i < 0);
    box.querySelectorAll("button[data-l]").forEach(function (b) {
      var on = !gcode && b.getAttribute("data-l") === lang;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var more = box.querySelector(".fm-more");
    more.classList.toggle("on", !!gcode);
    more.classList.toggle("g", !!gcode);
    more.querySelector(".code").textContent = gcode ? gcode.split("-")[0].toUpperCase() : "";
    box.querySelectorAll(".fm-pop button[data-g]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-g") === gcode); });
  }
  function mountSwitcher() {
    if (document.querySelector(".fm-language")) return;
    injectStyle();
    var box = document.createElement("div");
    box.className = "fm-language notranslate";
    box.setAttribute("translate", "no");
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "Language");
    var pop = G_LANGS.map(function (g) { return '<button type="button" data-g="' + g[0] + '">' + g[1] + "</button>"; }).join("");
    box.innerHTML =
      '<div class="fm-seg"><i class="fm-thumb"></i>' +
      '<button type="button" data-l="uz" title="O‘zbekcha (hozirgi lotin)">UZ</button>' +
      '<button type="button" data-l="uzn" title="Yangi o‘zbek alifbosi (Ö Ğ Ş Ç)">ÖZ</button>' +
      '<button type="button" data-l="ru" title="Русский">RU</button>' +
      '<button type="button" data-l="en" title="English">EN</button>' +
      '<button type="button" class="fm-more" aria-haspopup="true" aria-expanded="false" title="More languages">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.8 3 4.2 6.2 4.2 9.5s-1.4 6.5-4.2 9.5c-2.8-3-4.2-6.2-4.2-9.5S9.2 5.5 12 2.5z"/></svg><span class="code"></span></button></div>' +
      '<div class="fm-pop" hidden><h4>🌍 Other languages</h4><div class="grid">' + pop + '</div>' +
      '<small>Automatic translation by Google Translate. Needs an internet connection.</small></div>';
    var slot = document.querySelector("[data-lang-slot]");
    if (slot) { box.classList.add("inline"); slot.appendChild(box); } else document.body.appendChild(box);
    var popEl = box.querySelector(".fm-pop"), moreBtn = box.querySelector(".fm-more");
    function closePop() { popEl.hidden = true; moreBtn.setAttribute("aria-expanded", "false"); }
    box.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target : e.target.parentElement;
      var g = t.closest("button[data-g]"), b = t.closest("button[data-l]"), m = t.closest(".fm-more");
      if (g) { closePop(); setGoogle(g.getAttribute("data-g")); }
      else if (b) {
        closePop();
        if (gcode) { try { localStorage.setItem("fm_lang", b.getAttribute("data-l")); } catch (er) {} setGoogle(""); }
        else setLang(b.getAttribute("data-l"));
      } else if (m) {
        popEl.hidden = !popEl.hidden;
        moreBtn.setAttribute("aria-expanded", popEl.hidden ? "false" : "true");
      }
    });
    document.addEventListener("click", function (e) { if (!box.contains(e.target)) closePop(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePop(); });
    syncSwitcher();
  }

  /* ---------------- qidiruv yordamchisi (do'kon va mini-ilova uchun) ---------------- */
  var SYN = {
    "forma": "formalar futbolka jersey jerseys shirt kit форма формы футболка",
    "butsa": "butsalar boots boot cleats бутсы бутса",
    "to'p": "to'plar toplar top ball balls мяч мячи",
    "kubok": "kuboklar kubog kuboglar trophy cup кубок кубки",
    "boshqa": "other другое"
  };
  function variants(s) {
    var e = D[norm(s || "").toLowerCase()];
    var base = e ? [s, e.ru, e.en] : [String(s || "")];
    base.push(newLatin(s || ""));
    return base;
  }
  function squash(s) { return norm(s).toLowerCase().replace(/'/g, ""); }
  function match(p, q) {
    q = squash(q || "");
    if (!q) return true;
    var parts = variants(p.name).concat(variants(p.cat));
    parts.push(SYN[norm(p.cat || "").toLowerCase()] || "", String(p.price || ""));
    var hay = squash(parts.join(" "));
    return q.split(" ").every(function (w) { return hay.indexOf(w) > -1; });
  }

  window.FM_I18N = {
    get lang() { return lang; },
    setLang: setLang,
    t: function (s) { return tr(s, lang, ""); },
    newLatin: newLatin,
    google: setGoogle,
    variants: variants,
    match: match
  };

  function start() {
    document.documentElement.lang = lang === "uzn" ? "uz" : lang;
    mountSwitcher();
    if (gcode) { loadGoogle(); return; }          // Google Translate rejimi: sahifa o'zbekcha holida qoladi
    walk(document.documentElement);
    observe();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
