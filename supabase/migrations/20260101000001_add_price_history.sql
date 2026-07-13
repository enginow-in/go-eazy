-- Create price history table
create table if not exists public.price_history (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  old_price numeric(12, 2) not null,
  new_price numeric(12, 2) not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Create index for faster queries
create index if not exists idx_price_history_property_id 
on public.price_history (property_id);

create index if not exists idx_price_history_changed_at 
on public.price_history (changed_at desc);

-- Enable Row Level Security
alter table public.price_history enable row level security;

-- Policy: Anyone can view price history
create policy "Anyone can view price history"
on public.price_history
for select
using (true);

-- Policy: Only authenticated users can insert (system will handle this)
create policy "Authenticated users can insert price history"
on public.price_history
for insert
with check (auth.uid() is not null);

-- Function to automatically log price changes
create or replace function public.log_property_price_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only log if price actually changed
  if old.price is distinct from new.price then
    insert into public.price_history (
      property_id,
      old_price,
      new_price,
      changed_by
    )
    values (
      new.id,
      old.price,
      new.price,
      auth.uid()
    );
  end if;

  return new;
end;
$$;

-- Trigger to automatically log price changes
drop trigger if exists trg_log_property_price_change on public.properties;

create trigger trg_log_property_price_change
after update of price on public.properties
for each row
when (old.price is distinct from new.price)
execute function public.log_property_price_change();

-- Comment for documentation
comment on table public.price_history is 'Stores historical price changes for properties';
comment on function public.log_property_price_change is 'Automatically logs price changes when property price is updated';