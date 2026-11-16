-- FUTBOL MARKET: UZUM CARD chegirmasi uchun migratsiya
-- Supabase → SQL Editor oynasida bir marta ishga tushiring.
alter table public.orders
  add column if not exists discount integer not null default 0;
