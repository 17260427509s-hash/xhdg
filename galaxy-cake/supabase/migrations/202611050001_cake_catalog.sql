-- Additive version-1 catalog compatibility. Independent Supabase only.
-- Prepare/review locally; this change does not connect to any live database.
begin;

create or replace function public.valid_birthday_payload(p jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare c jsonb; item record; layer jsonb; key text; entry jsonb; kinds text[]; heroes integer; kind text;
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
  if c->>'cakeStyle' not in ('galaxy','strawberry','cream','purple','heart','chocolate','matcha','blueberry','mango','rainbow','moon','garden')
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
    if jsonb_typeof(layer) is distinct from 'object' or (layer-array['shape','cakeColor','creamColor','decoration','decorations','decorationColor','decorationDensity','decorationSeed'])<>'{}'::jsonb then return false; end if;
    if layer ? 'shape' and (jsonb_typeof(layer->'shape') is distinct from 'string' or layer->>'shape' not in ('round','square','heart')) then return false; end if;
    if layer ? 'decoration' and (jsonb_typeof(layer->'decoration') is distinct from 'string' or layer->>'decoration' not in ('none','galaxy','strawberry','cream','purple','heart')) then return false; end if;
    if layer ? 'decorations' then
      if jsonb_typeof(layer->'decorations') is distinct from 'array' or jsonb_array_length(layer->'decorations')>3 then return false; end if;
      kinds:='{}'; heroes:=0;
      for entry in select * from jsonb_array_elements(layer->'decorations') loop
        if jsonb_typeof(entry) is distinct from 'string' then return false; end if;
        kind:=entry#>>'{}';
        if kind not in ('stars','strawberry','crystal','hearts','blueberry','cherry','mango','chocolate','macaron','pearls','crescent','butterfly','bow','crown','flower','rainbow') or kind=any(kinds) then return false; end if;
        kinds:=array_append(kinds,kind);
        if kind in ('crescent','crown','rainbow') then
          heroes:=heroes+1;
          if heroes>1 or item.key::int<>(c->>'cakeLayers')::int-1 then return false; end if;
        end if;
      end loop;
    end if;
    if layer ? 'decorationDensity' and (jsonb_typeof(layer->'decorationDensity') is distinct from 'string' or layer->>'decorationDensity' not in ('sparse','standard','rich')) then return false; end if;
    if layer ? 'decorationSeed' then
      if jsonb_typeof(layer->'decorationSeed') is distinct from 'number' or layer->>'decorationSeed' !~ '^[0-9]{1,10}$' or (layer->>'decorationSeed')::bigint>2147483647 then return false; end if;
    end if;
    foreach key in array array['cakeColor','creamColor','decorationColor'] loop
      if layer ? key and (jsonb_typeof(layer->key) is distinct from 'string' or layer->>key !~ '^#[0-9a-fA-F]{6}$') then return false; end if;
    end loop;
  end loop;
  return true;
exception when others then return false;
end;
$$;
revoke all on function public.valid_birthday_payload(jsonb) from public, anon, authenticated;
grant execute on function public.valid_birthday_payload(jsonb) to authenticated;
commit;
