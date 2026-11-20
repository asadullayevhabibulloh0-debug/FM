-- =====================================================================
-- FUTBOL MARKET — Telegram bot foydalanuvchilari
-- Admin yangi mahsulot qo'shganda bot shu ro'yxatdagilarga xabar yuboradi.
-- Supabase → SQL Editor → New query → shu faylni joylab "Run" bosing.
-- Qayta ishga tushirsa ham xavfsiz.
-- =====================================================================
create table if not exists public.bot_users (
  chat_id    bigint primary key,
  name       text not null default '',
  username   text not null default '',
  blocked    boolean not null default false,   -- botni bloklagan bo'lsa xabar yuborilmaydi
  last_seen  timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.bot_users enable row level security;
