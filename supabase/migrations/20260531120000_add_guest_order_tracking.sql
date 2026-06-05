create extension if not exists "pgcrypto";

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.orders add column if not exists order_code text;
alter table public.orders add column if not exists tracking_token text;
alter table public.orders add column if not exists comment text;
alter table public.orders add column if not exists admin_note text;
alter table public.orders add column if not exists payment_method text default 'agreement';
alter table public.orders add column if not exists updated_at timestamptz default now();

alter table public.orders drop constraint if exists orders_status_check;
update public.orders set status = 'pending_confirmation' where status = 'pending';
alter table public.orders alter column status set default 'pending_confirmation';
alter table public.orders
  add constraint orders_status_check
  check (status in ('new', 'pending_confirmation', 'confirmed', 'processing', 'packaging', 'shipped', 'delivered', 'cancelled'));

create unique index if not exists orders_order_code_key on public.orders(order_code);
create unique index if not exists orders_tracking_token_key on public.orders(tracking_token);

do $$
declare
  existing_order record;
  generated_code text;
  generated_token text;
begin
  for existing_order in
    select id from public.orders where order_code is null or tracking_token is null
  loop
    loop
      generated_code := 'ORD-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
      exit when not exists (select 1 from public.orders where order_code = generated_code);
    end loop;

    generated_token := encode(gen_random_bytes(24), 'hex');
    update public.orders
      set order_code = coalesce(order_code, generated_code),
          tracking_token = coalesce(tracking_token, generated_token),
          updated_at = coalesce(updated_at, created_at, now())
      where id = existing_order.id;
  end loop;
end $$;

alter table public.orders alter column order_code set not null;
alter table public.orders alter column tracking_token set not null;
alter table public.orders alter column updated_at set not null;

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by_admin_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists order_status_history_order_id_idx
  on public.order_status_history(order_id, created_at);

insert into public.order_status_history (order_id, old_status, new_status, created_at)
select orders.id, null, orders.status, orders.created_at
from public.orders
where not exists (
  select 1 from public.order_status_history history where history.order_id = orders.id
);

alter table public.order_status_history enable row level security;
grant all privileges on table public.order_status_history to authenticated;
revoke all privileges on table public.order_status_history from anon;

drop policy if exists "Admins can read order status history" on public.order_status_history;
create policy "Admins can read order status history"
  on public.order_status_history for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can manage order status history" on public.order_status_history;
create policy "Admins can manage order status history"
  on public.order_status_history for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.clean_order_text(value text, maximum_length integer)
returns text
language sql
immutable
as $$
  select left(trim(regexp_replace(coalesce(value, ''), '[[:cntrl:]]', ' ', 'g')), maximum_length);
$$;

create or replace function public.place_public_order(shipping jsonb, items jsonb, customer_comment text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_order_id uuid;
  new_order_code text;
  new_tracking_token text;
  order_total numeric(10,2);
  requested_count integer;
  available_count integer;
  clean_shipping jsonb;
  clean_phone text;
begin
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'Order must contain at least one product';
  end if;

  clean_phone := public.clean_order_text(shipping->>'phone', 32);
  clean_shipping := jsonb_build_object(
    'fullName', public.clean_order_text(shipping->>'fullName', 120),
    'email', lower(public.clean_order_text(shipping->>'email', 160)),
    'phone', clean_phone,
    'address', public.clean_order_text(shipping->>'address', 240),
    'city', public.clean_order_text(shipping->>'city', 80)
  );

  if length(clean_shipping->>'address') < 5
    or length(clean_shipping->>'city') < 2 then
    raise exception 'Shipping details are incomplete';
  end if;

  if (clean_shipping->>'email') <> ''
    and (clean_shipping->>'email') !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Email is invalid';
  end if;

  if clean_phone <> '' and exists (
    select 1 from public.orders
    where shipping_address->>'phone' = clean_phone
      and created_at > now() - interval '15 minutes'
    group by shipping_address->>'phone'
    having count(*) >= 5
  ) then
    raise exception 'Too many orders. Please try again later';
  end if;

  create temporary table requested_order_items (
    product_id uuid primary key,
    quantity integer not null
  ) on commit drop;

  insert into requested_order_items (product_id, quantity)
  select item.product_id, sum(item.quantity)::integer
  from jsonb_to_recordset(items) as item(product_id uuid, quantity integer)
  group by item.product_id;

  if exists (select 1 from requested_order_items where quantity <= 0 or product_id is null) then
    raise exception 'Every order item must contain a product and a positive quantity';
  end if;

  perform 1
  from public.products product
  join requested_order_items item on item.product_id = product.id
  for update of product;

  select count(*) into requested_count from requested_order_items;
  select count(*), coalesce(sum(product.price * item.quantity), 0)
    into available_count, order_total
  from requested_order_items item
  join public.products product on product.id = item.product_id
  where product.is_published = true
    and product.deleted_at is null
    and product.stock_count >= item.quantity;

  if available_count <> requested_count then
    raise exception 'One or more products are unavailable';
  end if;

  loop
    new_order_code := 'ORD-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
    exit when not exists (select 1 from public.orders where order_code = new_order_code);
  end loop;
  new_tracking_token := encode(gen_random_bytes(24), 'hex');

  insert into public.orders (
    buyer_id, order_code, tracking_token, status, total_price, shipping_address, comment, payment_method
  )
  values (
    null, new_order_code, new_tracking_token, 'pending_confirmation', order_total, clean_shipping,
    nullif(public.clean_order_text(customer_comment, 500), ''), 'agreement'
  )
  returning id into new_order_id;

  insert into public.order_items (order_id, product_id, product_title, quantity, price_at_purchase)
  select new_order_id, product.id, product.title, item.quantity, product.price
  from requested_order_items item
  join public.products product on product.id = item.product_id;

  update public.products product
  set stock_count = product.stock_count - item.quantity
  from requested_order_items item
  where product.id = item.product_id;

  insert into public.order_status_history (order_id, old_status, new_status)
  values (new_order_id, null, 'pending_confirmation');

  return jsonb_build_object('orderCode', new_order_code, 'trackingToken', new_tracking_token);
end;
$$;

drop function if exists public.place_public_order(jsonb, jsonb);
revoke all on function public.place_public_order(jsonb, jsonb, text) from public;
grant execute on function public.place_public_order(jsonb, jsonb, text) to anon, authenticated;

create or replace function public.get_public_order_tracking(tracking_token_input text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'orderCode', orders.order_code,
    'status', orders.status,
    'createdAt', orders.created_at,
    'updatedAt', orders.updated_at,
    'customerName', orders.shipping_address->>'fullName',
    'maskedPhone', regexp_replace(orders.shipping_address->>'phone', '.(?=.{4})', '*', 'g'),
    'city', orders.shipping_address->>'city',
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'title', items.product_title,
        'quantity', items.quantity
      ) order by items.id)
      from public.order_items items
      where items.order_id = orders.id
    ), '[]'::jsonb),
    'history', coalesce((
      select jsonb_agg(jsonb_build_object(
        'status', history.new_status,
        'createdAt', history.created_at
      ) order by history.created_at)
      from public.order_status_history history
      where history.order_id = orders.id
    ), '[]'::jsonb)
  )
  from public.orders
  where orders.tracking_token = tracking_token_input;
$$;

revoke all on function public.get_public_order_tracking(text) from public;
grant execute on function public.get_public_order_tracking(text) to anon, authenticated;

create or replace function public.update_order_status(order_id_input uuid, new_status_input text, admin_note_input text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_status text;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if new_status_input not in ('new', 'pending_confirmation', 'confirmed', 'processing', 'packaging', 'shipped', 'delivered', 'cancelled') then
    raise exception 'Invalid order status';
  end if;

  select status into previous_status from public.orders where id = order_id_input for update;
  if previous_status is null then
    raise exception 'Order not found';
  end if;

  update public.orders
    set status = new_status_input,
        admin_note = nullif(public.clean_order_text(admin_note_input, 500), ''),
        updated_at = now()
    where id = order_id_input;

  if previous_status <> new_status_input then
    insert into public.order_status_history (order_id, old_status, new_status, changed_by_admin_id)
    values (order_id_input, previous_status, new_status_input, auth.uid());
  end if;
end;
$$;

revoke all on function public.update_order_status(uuid, text, text) from public;
grant execute on function public.update_order_status(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
