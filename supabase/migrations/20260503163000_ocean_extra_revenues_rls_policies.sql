-- ocean_extra_revenues had RLS enabled in init without policies → anon/authenticated requests fail.
-- Matches supabase_ocean_extra_revenues.sql (manual) so migrations + db push apply the same fixes.

alter table public.ocean_extra_revenues enable row level security;

grant select, insert, update, delete on table public.ocean_extra_revenues to anon;
grant select, insert, update, delete on table public.ocean_extra_revenues to authenticated;

drop policy if exists "Allow anon read write ocean_extra_revenues" on public.ocean_extra_revenues;
create policy "Allow anon read write ocean_extra_revenues"
  on public.ocean_extra_revenues for all to anon
  using (true) with check (true);

drop policy if exists "Allow authenticated read write ocean_extra_revenues" on public.ocean_extra_revenues;
create policy "Allow authenticated read write ocean_extra_revenues"
  on public.ocean_extra_revenues for all to authenticated
  using (true) with check (true);
