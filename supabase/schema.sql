-- =====================================================================
-- FUTBOL MARKET — Supabase bazasi
-- Supabase → SQL Editor → New query → shu faylni to'liq joylab "Run" bosing.
-- Qayta ishga tushirsa ham xavfsiz (bor narsani buzmaydi).
-- =====================================================================

-- Mahsulotlar (sayt, Telegram Mini App va bot shu ro'yxatni ishlatadi)
create table if not exists public.products (
  id         bigint primary key,
  name       text    not null,
  cat        text    not null default '',
  price      integer not null check (price >= 0),
  img        text    not null default './card.png',
  sizes      text[]  not null default '{}',
  custom     boolean not null default false,
  custom_back_image text not null default '',
  custom_text_color text not null default '#FFFFFF',
  created_at timestamptz not null default now()
);

-- Buyurtmalar: savatdagi har bir mahsulot alohida qator, order_id bilan bog'langan
create table if not exists public.orders (
  id           bigint primary key,
  order_id     text,
  source       text,
  tg_user_id   bigint,
  user_id      text,
  user_name    text,
  email        text,
  product_id   bigint,
  product      text,
  category     text,
  size         text,
  quantity     integer not null default 1,
  custom       boolean not null default false,
  shirt_name   text,
  shirt_number text,
  shirt_color text,
  custom_back_image text,
  unit_price   integer,
  delivery     integer not null default 0,
  total        integer,
  phone        text,
  address      text,
  location     text,
  payment      text,
  card_last4   text,
  note         text,
  status       text not null default 'Yangi',
  date         timestamptz not null default now()
);
create index if not exists orders_order_id_idx on public.orders (order_id);

-- Xavfsizlik: brauzerdan to'g'ridan-to'g'ri o'qish/yozish yopiq.
-- Faqat server (api/*.js, server.js) SUPABASE_SERVICE_ROLE_KEY bilan ishlaydi.
alter table public.products enable row level security;
alter table public.orders   enable row level security;

-- Admin panelda yuklangan mahsulot rasmlari uchun ochiq papka (Storage)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Boshlang'ich mahsulotlar (products.json bilan bir xil)
insert into public.products (id, name, cat, price, img, sizes, custom) values
  (1, 'Real Madrid Uy Formasi',      'Forma', 899000, './real.png',  '{XS,S,M,L,XL,XXL}',          true),
  (2, 'Real Madrid Mehmon Formasi',  'Forma', 899000, './logo.png',  '{XS,S,M,L,XL,XXL}',          true),
  (3, 'Professional Futbol Butsasi', 'Butsa', 749000, './butsa.png', '{39,40,41,42,43,44,45,46}',  false),
  (4, 'Match Futbol To‘pi',          'To‘p',  299000, './top.png',   '{5-razmer}',                 false),
  (5, 'Chempionlar Kubogi',          'Kubok', 499000, './kubog.png', '{Standart}',                 false),
  (6, 'Futbol Forma Premium',        'Forma', 799000, './ota.png',   '{S,M,L,XL}',                 true)
on conflict (id) do nothing;

-- Yangi orqa yozuv sozlamalari: eski loyihalarda ham xavfsiz qo‘shiladi
alter table public.products add column if not exists custom_back_image text not null default '';
alter table public.products add column if not exists custom_text_color text not null default '#FFFFFF';
alter table public.orders add column if not exists shirt_color text;
alter table public.orders add column if not exists custom_back_image text;

-- UZUM CARD chegirmasi (butun buyurtmaga bir marta; birinchi qatorlarga taqsimlanadi)
alter table public.orders add column if not exists discount integer not null default 0;

-- Admin paneldagi "eski narx" (chegirmadan oldingi narx)
alter table public.products add column if not exists old_price integer not null default 0;

-- Telegram bot foydalanuvchilari (yangi mahsulot xabari uchun) — BOT_USERS_MIGRATION.sql bilan bir xil
create table if not exists public.bot_users (
  chat_id    bigint primary key,
  name       text not null default '',
  username   text not null default '',
  blocked    boolean not null default false,
  last_seen  timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.bot_users enable row level security;
