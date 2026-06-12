-- Vegetable Shop Manager - Supabase/PostgreSQL Schema
-- Version: 1
-- Purpose: Cloud database foundation for hybrid offline desktop SQLite + cloud sync.

create extension if not exists "pgcrypto";

-- Updated timestamp helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Shops
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner text,
  address text,
  phone text,
  upi_id text,
  receipt_size text default '80mm',
  receipt_footer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  device_id text,
  version integer not null default 1
);

-- App users mapped to shops
create table if not exists public.shop_users (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'staff', 'viewer')),
  created_at timestamptz not null default now(),
  unique(shop_id, user_id)
);

-- Vegetables / fruits / items
create table if not exists public.vegetables (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  hindi_name text,
  category text,
  unit text not null,
  barcode text,
  purchase_rate numeric(12,2) default 0,
  selling_rate numeric(12,2) default 0,
  stock numeric(12,3) default 0,
  low_stock numeric(12,3) default 0,
  wastage_percent numeric(6,2) default 0,
  active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  device_id text,
  version integer not null default 1,
  unique(shop_id, local_id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  balance numeric(12,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  device_id text,
  version integer not null default 1,
  unique(shop_id, local_id)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  device_id text,
  version integer not null default 1,
  unique(shop_id, local_id)
);

-- Sales are append-first. Prefer cancellation/return records over editing old bills.
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  shop_id uuid not null references public.shops(id) on delete cascade,
  bill_no text not null,
  date timestamptz not null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_local_id text,
  customer_name text,
  customer_phone text,
  subtotal numeric(12,2) default 0,
  discount numeric(12,2) default 0,
  round_off numeric(12,2) default 0,
  total numeric(12,2) default 0,
  paid numeric(12,2) default 0,
  due numeric(12,2) default 0,
  payment_mode text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  device_id text,
  version integer not null default 1,
  unique(shop_id, local_id),
  unique(shop_id, bill_no)
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  shop_id uuid not null references public.shops(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  sale_local_id text,
  vegetable_id uuid references public.vegetables(id) on delete set null,
  vegetable_local_id text,
  name text not null,
  hindi_name text,
  unit text,
  qty numeric(12,3) default 0,
  rate numeric(12,2) default 0,
  discount numeric(12,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  device_id text,
  version integer not null default 1,
  unique(shop_id, local_id)
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  shop_id uuid not null references public.shops(id) on delete cascade,
  date timestamptz not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier_local_id text,
  supplier_name text,
  total numeric(12,2) default 0,
  paid numeric(12,2) default 0,
  due numeric(12,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  device_id text,
  version integer not null default 1,
  unique(shop_id, local_id)
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  shop_id uuid not null references public.shops(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  purchase_local_id text,
  vegetable_id uuid references public.vegetables(id) on delete set null,
  vegetable_local_id text,
  name text not null,
  qty numeric(12,3) default 0,
  rate numeric(12,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  device_id text,
  version integer not null default 1,
  unique(shop_id, local_id)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  shop_id uuid not null references public.shops(id) on delete cascade,
  date timestamptz not null,
  party_type text not null check (party_type in ('customer', 'supplier')),
  party_id uuid,
  party_local_id text,
  party_name text,
  amount numeric(12,2) default 0,
  mode text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  device_id text,
  version integer not null default 1,
  unique(shop_id, local_id)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  shop_id uuid not null references public.shops(id) on delete cascade,
  date timestamptz not null,
  title text not null,
  amount numeric(12,2) default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  device_id text,
  version integer not null default 1,
  unique(shop_id, local_id)
);

create table if not exists public.stock_logs (
  id uuid primary key default gen_random_uuid(),
  local_id text,
  shop_id uuid not null references public.shops(id) on delete cascade,
  date timestamptz not null,
  vegetable_id uuid references public.vegetables(id) on delete set null,
  vegetable_local_id text,
  vegetable_name text,
  type text not null,
  qty numeric(12,3) default 0,
  before_stock numeric(12,3) default 0,
  after_stock numeric(12,3) default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  device_id text,
  version integer not null default 1,
  unique(shop_id, local_id)
);

-- Per-device sync state
create table if not exists public.sync_devices (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  device_id text not null,
  device_name text,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(shop_id, device_id)
);

-- Indexes
create index if not exists idx_shop_users_user on public.shop_users(user_id);
create index if not exists idx_vegetables_shop_updated on public.vegetables(shop_id, updated_at);
create index if not exists idx_customers_shop_updated on public.customers(shop_id, updated_at);
create index if not exists idx_suppliers_shop_updated on public.suppliers(shop_id, updated_at);
create index if not exists idx_sales_shop_date on public.sales(shop_id, date);
create index if not exists idx_sales_shop_updated on public.sales(shop_id, updated_at);
create index if not exists idx_sale_items_sale on public.sale_items(sale_id);
create index if not exists idx_purchases_shop_date on public.purchases(shop_id, date);
create index if not exists idx_payments_shop_date on public.payments(shop_id, date);
create index if not exists idx_expenses_shop_date on public.expenses(shop_id, date);
create index if not exists idx_stock_logs_shop_date on public.stock_logs(shop_id, date);

-- Triggers
-- Drop triggers first so this schema can be re-run safely.
drop trigger if exists set_shops_updated_at on public.shops;
drop trigger if exists set_vegetables_updated_at on public.vegetables;
drop trigger if exists set_customers_updated_at on public.customers;
drop trigger if exists set_suppliers_updated_at on public.suppliers;
drop trigger if exists set_sales_updated_at on public.sales;
drop trigger if exists set_sale_items_updated_at on public.sale_items;
drop trigger if exists set_purchases_updated_at on public.purchases;
drop trigger if exists set_purchase_items_updated_at on public.purchase_items;
drop trigger if exists set_payments_updated_at on public.payments;
drop trigger if exists set_expenses_updated_at on public.expenses;
drop trigger if exists set_stock_logs_updated_at on public.stock_logs;
drop trigger if exists set_sync_devices_updated_at on public.sync_devices;

create trigger set_shops_updated_at before update on public.shops for each row execute function public.set_updated_at();
create trigger set_vegetables_updated_at before update on public.vegetables for each row execute function public.set_updated_at();
create trigger set_customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger set_suppliers_updated_at before update on public.suppliers for each row execute function public.set_updated_at();
create trigger set_sales_updated_at before update on public.sales for each row execute function public.set_updated_at();
create trigger set_sale_items_updated_at before update on public.sale_items for each row execute function public.set_updated_at();
create trigger set_purchases_updated_at before update on public.purchases for each row execute function public.set_updated_at();
create trigger set_purchase_items_updated_at before update on public.purchase_items for each row execute function public.set_updated_at();
create trigger set_payments_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger set_expenses_updated_at before update on public.expenses for each row execute function public.set_updated_at();
create trigger set_stock_logs_updated_at before update on public.stock_logs for each row execute function public.set_updated_at();
create trigger set_sync_devices_updated_at before update on public.sync_devices for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.shops enable row level security;
alter table public.shop_users enable row level security;
alter table public.vegetables enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.stock_logs enable row level security;
alter table public.sync_devices enable row level security;

-- Helper for RLS
create or replace function public.user_has_shop_access(target_shop_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.shop_users su
    where su.shop_id = target_shop_id
    and su.user_id = auth.uid()
  );
$$ language sql stable security definer;

-- Basic shop access policies
-- Drop policies first so this schema can be re-run safely.
drop policy if exists "Users can view their shops" on public.shops;
drop policy if exists "Users can update their shops" on public.shops;
drop policy if exists "Authenticated users can create shops" on public.shops;

drop policy if exists "Users can view shop memberships" on public.shop_users;
drop policy if exists "Users can create own membership" on public.shop_users;

drop policy if exists "vegetables shop access" on public.vegetables;
drop policy if exists "customers shop access" on public.customers;
drop policy if exists "suppliers shop access" on public.suppliers;
drop policy if exists "sales shop access" on public.sales;
drop policy if exists "sale_items shop access" on public.sale_items;
drop policy if exists "purchases shop access" on public.purchases;
drop policy if exists "purchase_items shop access" on public.purchase_items;
drop policy if exists "payments shop access" on public.payments;
drop policy if exists "expenses shop access" on public.expenses;
drop policy if exists "stock_logs shop access" on public.stock_logs;
drop policy if exists "sync_devices shop access" on public.sync_devices;

create policy "Users can view their shops" on public.shops for select using (public.user_has_shop_access(id));
create policy "Users can update their shops" on public.shops for update using (public.user_has_shop_access(id));
create policy "Authenticated users can create shops" on public.shops for insert with check (auth.uid() is not null);

create policy "Users can view shop memberships" on public.shop_users for select using (user_id = auth.uid() or public.user_has_shop_access(shop_id));
create policy "Users can create own membership" on public.shop_users for insert with check (user_id = auth.uid());

-- Generic per-shop policies for data tables
create policy "vegetables shop access" on public.vegetables for all using (public.user_has_shop_access(shop_id)) with check (public.user_has_shop_access(shop_id));
create policy "customers shop access" on public.customers for all using (public.user_has_shop_access(shop_id)) with check (public.user_has_shop_access(shop_id));
create policy "suppliers shop access" on public.suppliers for all using (public.user_has_shop_access(shop_id)) with check (public.user_has_shop_access(shop_id));
create policy "sales shop access" on public.sales for all using (public.user_has_shop_access(shop_id)) with check (public.user_has_shop_access(shop_id));
create policy "sale_items shop access" on public.sale_items for all using (public.user_has_shop_access(shop_id)) with check (public.user_has_shop_access(shop_id));
create policy "purchases shop access" on public.purchases for all using (public.user_has_shop_access(shop_id)) with check (public.user_has_shop_access(shop_id));
create policy "purchase_items shop access" on public.purchase_items for all using (public.user_has_shop_access(shop_id)) with check (public.user_has_shop_access(shop_id));
create policy "payments shop access" on public.payments for all using (public.user_has_shop_access(shop_id)) with check (public.user_has_shop_access(shop_id));
create policy "expenses shop access" on public.expenses for all using (public.user_has_shop_access(shop_id)) with check (public.user_has_shop_access(shop_id));
create policy "stock_logs shop access" on public.stock_logs for all using (public.user_has_shop_access(shop_id)) with check (public.user_has_shop_access(shop_id));
create policy "sync_devices shop access" on public.sync_devices for all using (public.user_has_shop_access(shop_id)) with check (public.user_has_shop_access(shop_id));

-- Notes:
-- 1. Desktop local IDs are stored in local_id for mapping SQLite records to cloud UUIDs.
-- 2. For first sync, create a shop, create shop_users membership, then upsert records by (shop_id, local_id).
-- 3. For append-only tables (sales, sale_items, stock_logs), avoid updates except cancellation/deleted_at metadata.
