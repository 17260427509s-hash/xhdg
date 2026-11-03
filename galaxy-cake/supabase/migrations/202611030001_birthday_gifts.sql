-- Independent project only. Never apply to the old birthday site's database.
begin;

create function public.valid_birthday_payload(p jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare c jsonb; item record; layer jsonb; key text;
begin
  if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>24000
    or p->'version' is distinct from '1'::jsonb
    or jsonb_typeof(p->'musicEnabled') is distinct from 'boolean'
    or (p-array['version','config','musicEnabled'])<>'{}'::jsonb then return false; end if;
  c:=p->'config';
  if jsonb_typeof(c) is distinct from 'object' then return false; end if;
  if not (c ?& array['cakeStyle','cakeShape','cakeLayers','cakeColor','layerOverrides','recipient','birthday','age','sender','message','candleType','flameEnabled','galaxyEnabled','galaxyTheme','galaxyCount','galaxySpeed'])
    or (c-array['cakeStyle','cakeShape','cakeLayers','cakeColor','layerOverrides','recipient','birthday','age','sender','message','candleType','flameEnabled','galaxyEnabled','galaxyTheme','galaxyCount','galaxySpeed'])<>'{}'::jsonb then return false; end if;
  foreach key in array array['cakeStyle','cakeShape','cakeColor','recipient','birthday','sender','message','candleType','galaxyTheme'] loop
    if jsonb_typeof(c->key) is distinct from 'string' then return false; end if;
  end loop;
  if c->>'cakeStyle' not in ('galaxy','strawberry','cream','purple','heart')
    or c->>'cakeShape' not in ('round','square','heart')
    or c->>'candleType' not in ('regular','number')
    or c->>'galaxyTheme' not in ('dream','rose','blue','gold','rainbow')
    or c->>'cakeColor' !~ '^#[0-9a-fA-F]{6}$'
    or length(c->>'recipient')>24 or length(c->>'sender')>24 or length(c->>'message')>300
    or jsonb_typeof(c->'flameEnabled') is distinct from 'boolean'
    or jsonb_typeof(c->'galaxyEnabled') is distinct from 'boolean' then return false; end if;
  foreach key in array array['age','cakeLayers','galaxyCount','galaxySpeed'] loop
    if jsonb_typeof(c->key) is distinct from 'number' then return false; end if;
  end loop;
  if (c->>'age')!~ '^[0-9]{1,3}$' or (c->>'age')::int not between 0 and 120
    or (c->>'cakeLayers') not in ('1','2','3')
    or (c->>'galaxyCount')!~ '^[0-9]{3}$' or (c->>'galaxyCount')::int not between 100 and 600
    or (c->>'galaxySpeed') not in ('0.5','1','1.5') then return false; end if;
  if c->>'birthday'<>'' then
    if c->>'birthday' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or to_char((c->>'birthday')::date,'YYYY-MM-DD')<>c->>'birthday' then return false; end if;
  end if;
  if jsonb_typeof(c->'layerOverrides') is distinct from 'object' then return false; end if;
  for item in select * from jsonb_each(c->'layerOverrides') loop
    if item.key not in ('0','1','2') or item.key::int>=(c->>'cakeLayers')::int then return false; end if;
    layer:=item.value;
    if jsonb_typeof(layer) is distinct from 'object' or (layer-array['shape','cakeColor','creamColor','decoration'])<>'{}'::jsonb then return false; end if;
    if layer ? 'shape' and (jsonb_typeof(layer->'shape') is distinct from 'string' or layer->>'shape' not in ('round','square','heart')) then return false; end if;
    if layer ? 'decoration' and (jsonb_typeof(layer->'decoration') is distinct from 'string' or layer->>'decoration' not in ('none','galaxy','strawberry','cream','purple','heart')) then return false; end if;
    foreach key in array array['cakeColor','creamColor'] loop
      if layer ? key and (jsonb_typeof(layer->key) is distinct from 'string' or layer->>key !~ '^#[0-9a-fA-F]{6}$') then return false; end if;
    end loop;
  end loop;
  return true;
exception when others then return false;
end;
$$;
revoke all on function public.valid_birthday_payload(jsonb) from public, anon, authenticated;
grant execute on function public.valid_birthday_payload(jsonb) to authenticated;

create table public.birthday_gifts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  payload jsonb not null check (public.valid_birthday_payload(payload)),
  created_at timestamptz not null default now()
);
create index birthday_gifts_owner_created_idx on public.birthday_gifts(created_by,created_at);
alter table public.birthday_gifts enable row level security;
alter table public.birthday_gifts force row level security;
revoke all on public.birthday_gifts from public, anon, authenticated;
grant select, insert, delete on public.birthday_gifts to authenticated;
create policy gift_owner_read on public.birthday_gifts for select to authenticated using ((select auth.uid())=created_by);
create policy gift_owner_insert on public.birthday_gifts for insert to authenticated with check ((select auth.uid())=created_by);
create policy gift_owner_delete on public.birthday_gifts for delete to authenticated using ((select auth.uid())=created_by);
-- Published snapshots are immutable: no UPDATE policy or grant.

create function public.limit_birthday_gifts()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or new.created_by<>auth.uid() then raise insufficient_privilege; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text,0));
  if (select count(*) from public.birthday_gifts where created_by=auth.uid() and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')>=20 then
    raise exception 'daily gift limit reached' using errcode='P0001';
  end if;
  new.created_at:=now();
  return new;
end;
$$;
revoke all on function public.limit_birthday_gifts() from public, anon, authenticated;
create trigger birthday_gift_quota before insert on public.birthday_gifts for each row execute function public.limit_birthday_gifts();

-- Public-by-link read: one unpredictable UUID, no list endpoint and no owner data.
create function public.read_birthday_gift(gift_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select payload from public.birthday_gifts where id=gift_id limit 1;
$$;
revoke all on function public.read_birthday_gift(uuid) from public, anon, authenticated;
grant execute on function public.read_birthday_gift(uuid) to anon, authenticated;
commit;
