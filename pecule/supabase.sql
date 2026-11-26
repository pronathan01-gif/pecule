-- Pécule : table des budgets (une ligne par utilisateur)
-- À coller dans Supabase > SQL Editor > New query, puis "Run".

create table if not exists public.budgets (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.budgets enable row level security;

-- Chaque utilisateur ne voit et ne modifie QUE sa propre ligne
drop policy if exists "lire mon budget" on public.budgets;
create policy "lire mon budget" on public.budgets
  for select using (auth.uid() = user_id);

drop policy if exists "créer mon budget" on public.budgets;
create policy "créer mon budget" on public.budgets
  for insert with check (auth.uid() = user_id);

drop policy if exists "modifier mon budget" on public.budgets;
create policy "modifier mon budget" on public.budgets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "supprimer mon budget" on public.budgets;
create policy "supprimer mon budget" on public.budgets
  for delete using (auth.uid() = user_id);
