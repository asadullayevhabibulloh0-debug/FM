-- FUTBOL MARKET: forma orqa yozuvi sozlamalari
-- Supabase SQL Editor oynasida bir marta ishga tushiring.
alter table public.products
  add column if not exists custom_back_image text not null default '',
  add column if not exists custom_text_color text not null default '#FFFFFF';

alter table public.orders
  add column if not exists shirt_color text,
  add column if not exists custom_back_image text;
