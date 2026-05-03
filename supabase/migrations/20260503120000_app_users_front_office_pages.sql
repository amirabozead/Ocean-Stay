-- Front office: same keys as ROLE_DEFAULT_PAGES_FRONT_OFFICE in src/data/constants.js
-- (all app areas except dailyRate / Rate Analysis, reports, settings).
-- Keep this JSON in sync when APP_PAGES or front-office policy changes.

create or replace function public.app_users_front_office_pages()
returns jsonb
language sql
immutable
as $$
  select '["dashboard","reservations","rooms","revenue","store","expenses"]'::jsonb;
$$;

comment on function public.app_users_front_office_pages() is
  'Default allowed_pages for role front_office / frontoffice; mirrors src/data/constants.js ROLE_DEFAULT_PAGES_FRONT_OFFICE.';

-- Apply front-office page list when the row is created with only the table default (["dashboard"])
-- or when role is changed to front_office (matches in-app "Apply role defaults").
create or replace function public.app_users_apply_front_office_pages()
returns trigger
language plpgsql
as $$
declare
  fo jsonb := public.app_users_front_office_pages();
  dash jsonb := '["dashboard"]'::jsonb;
begin
  if new.role is null then
    return new;
  end if;

  if lower(new.role) not in ('front_office', 'frontoffice') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.allowed_pages = dash then
      new.allowed_pages := fo;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.role is distinct from new.role then
      new.allowed_pages := fo;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists app_users_front_office_pages on public.app_users;

create trigger app_users_front_office_pages
  before insert or update of role on public.app_users
  for each row
  execute function public.app_users_apply_front_office_pages();

-- Existing cloud users: normalize front-office rows to the current standard list.
update public.app_users
set allowed_pages = public.app_users_front_office_pages()
where lower(role) in ('front_office', 'frontoffice');
