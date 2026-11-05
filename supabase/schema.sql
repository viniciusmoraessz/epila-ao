begin;
create table services(id serial primary key,name text not null,description text not null,category text not null,duration int not null check(duration between 5 and 480),price numeric(8,2) check(price>=0),active boolean not null default true);
create table clients(id uuid primary key default gen_random_uuid(),name text not null,phone text unique not null);
create table settings(id int primary key check(id=1),lead_minutes int not null check(lead_minutes>=0),horizon int not null check(horizon between 1 and 365),gap int not null check(gap between 0 and 180),cancel_hours int not null check(cancel_hours>=0));
create table working_hours(id serial primary key,weekday int not null check(weekday between 0 and 6),opens time not null,closes time not null,check(opens<closes),unique(weekday,opens));
create table blocked_dates(day date primary key,reason text);
create table appointments(id uuid primary key default gen_random_uuid(),token uuid unique not null default gen_random_uuid(),client_id uuid references clients not null,client_name text not null,starts timestamp not null,ends timestamp not null,busy_until timestamp not null,notes text not null default '',status text not null default 'pendente' check(status in ('pendente','confirmado','concluído','cancelado','faltou')),check(starts<ends and ends<=busy_until),exclude using gist(tsrange(starts,busy_until,'[)') with &&) where(status <> 'cancelado'));
create table appointment_services(appointment_id uuid references appointments,id int references services,name text not null,duration int not null,price numeric(8,2),primary key(appointment_id,id));
insert into settings values(1,120,45,10,12);
-- Exemplo: dois turnos por dia, com pausa entre eles.
insert into working_hours(weekday,opens,closes) select d,o,c from generate_series(1,6) d cross join (values(time '08:00',time '12:00'),(time '13:00',time '18:00')) h(o,c);
insert into services(name,description,duration,category) values
('Axila','Cuidado delicado para as axilas.',15,'Corporal'),
('Virilha simples','Contorno da virilha, respeitando sua preferência.',25,'Íntima'),
('Virilha completa','Epilação íntima com privacidade e acolhimento.',45,'Íntima'),
('Meia perna','Dos joelhos aos tornozelos.',30,'Corporal'),
('Perna inteira','Cuidado das coxas aos tornozelos.',50,'Corporal'),
('Buço','Precisão e delicadeza acima dos lábios.',10,'Facial'),
('Sobrancelha','Limpeza dos pelos ao redor das sobrancelhas.',20,'Facial'),
('Braços','Epilação da região dos braços.',30,'Corporal'),
('Costas','Atendimento dedicado à região das costas.',40,'Corporal'),
('Barriga','Remoção dos pelos na região abdominal.',20,'Corporal'),
('Combo de áreas','Axilas e meia perna na mesma visita.',45,'Combos');
create function is_owner() returns boolean language sql stable as $$select coalesce(auth.jwt()->'app_metadata'->>'role'='studio_admin',false)$$;
do $$declare t text;begin foreach t in array array['services','clients','appointments','appointment_services','working_hours','blocked_dates','settings'] loop
execute format('alter table %I enable row level security',t);
execute format('revoke all on %I from anon,authenticated',t);
execute format('grant select,insert,update,delete on %I to authenticated',t);
execute format('create policy owner on %I for all to authenticated using(is_owner()) with check(is_owner())',t);
end loop;end$$;
grant select on services to anon;
grant usage,select on all sequences in schema public to authenticated;
create policy catalog on services for select using(active);
-- Todos os timestamps da agenda representam o horário civil de Buíque.
create function free_times(p_day date,p_duration int,p_skip uuid default null) returns table(slot timestamp) language sql stable security definer set search_path=public,pg_temp as $$
select distinct v from working_hours w cross join settings s cross join lateral generate_series(p_day+w.opens,p_day+w.closes-make_interval(mins=>p_duration+s.gap),interval '15 minutes') v
where w.weekday=extract(dow from p_day) and p_duration>0 and p_day <= (now() at time zone 'America/Recife')::date+s.horizon
and v >= (now() at time zone 'America/Recife')+make_interval(mins=>s.lead_minutes)
and not exists(select from blocked_dates b where b.day=p_day)
and not exists(select from appointments a where a.id is distinct from p_skip and a.status<>'cancelado' and tsrange(a.starts,a.busy_until,'[)') && tsrange(v,v+make_interval(mins=>p_duration+s.gap),'[)')) order by 1$$;
create function availability(p_day date,p_ids int[]) returns table(slot timestamp) language sql stable security definer set search_path=public,pg_temp as $$
select * from free_times(p_day,(select sum(duration)::int from services where active and id=any(p_ids) having count(*)=cardinality(p_ids)))$$;
create function book(p_ids int[],p_start timestamp,p_name text,p_phone text,p_notes text) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare a appointments; cust uuid; dur int; begin
if length(trim(p_name)) not between 2 and 100 or p_phone !~ '^[1-9][0-9]{9,10}$' or length(p_notes)>1000 then raise exception 'Dados inválidos';end if;
perform id from services where id=any(p_ids) for share;
if not exists(select from availability(p_start::date,p_ids) where slot=p_start) then raise exception 'Horário indisponível';end if;
select sum(duration) into dur from services where id=any(p_ids);
insert into clients(name,phone) values(trim(p_name),p_phone) on conflict(phone) do update set phone=excluded.phone returning id into cust;
insert into appointments(client_id,client_name,starts,ends,busy_until,notes) select cust,trim(p_name),p_start,p_start+make_interval(mins=>dur),p_start+make_interval(mins=>dur+gap),coalesce(p_notes,'') from settings returning * into a;
insert into appointment_services select a.id,id,name,duration,price from services where id=any(p_ids);
return a.token;end $$;
create function ticket(p_token uuid,p_cancel boolean default false) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare a appointments;begin select * into strict a from appointments where token=p_token for update;
if p_cancel and a.status<>'cancelado' then
if a.status not in ('pendente','confirmado') or a.starts <= (now() at time zone 'America/Recife')+(select make_interval(hours=>cancel_hours) from settings) then raise exception 'Prazo de cancelamento encerrado';end if;
update appointments set status='cancelado' where id=a.id returning * into a;end if;
return jsonb_build_object('name',a.client_name,'starts',a.starts,'status',a.status,'items',(select jsonb_agg(jsonb_build_object('name',name,'duration',duration,'price',price)) from appointment_services where appointment_id=a.id));end$$;
create function reschedule(p_id uuid,p_start timestamp) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare dur int;begin if not is_owner() then raise exception 'Acesso restrito';end if;
select extract(epoch from ends-starts)::int/60 into strict dur from appointments where id=p_id and status in ('pendente','confirmado') for update;
if not exists(select from free_times(p_start::date,dur,p_id) where slot=p_start) then raise exception 'Horário indisponível';end if;
update appointments set starts=p_start,ends=p_start+make_interval(mins=>dur),busy_until=p_start+make_interval(mins=>dur+(select gap from settings)) where id=p_id;end$$;
revoke all on function free_times(date,int,uuid),book(int[],timestamp,text,text,text),availability(date,int[]),ticket(uuid,boolean),reschedule(uuid,timestamp) from public,anon,authenticated;
grant execute on function book(int[],timestamp,text,text,text),availability(date,int[]),ticket(uuid,boolean) to anon,authenticated;
grant execute on function reschedule(uuid,timestamp) to authenticated;
commit;
create function available_days(p_month date,p_ids int[]) returns table(day text) language sql stable security definer set search_path=public,pg_temp as $$
select to_char(d,'YYYY-MM-DD') from generate_series(date_trunc('month',p_month::timestamp),date_trunc('month',p_month::timestamp)+interval '1 month - 1 day',interval '1 day') d where exists(select from availability(d::date,p_ids)) order by d$$;
grant execute on function available_days(date,int[]) to anon,authenticated;
insert into blocked_dates(day,reason)
select make_date(y,m,d),'Feriado nacional' from generate_series(extract(year from current_date)::int,extract(year from current_date)::int+5) y cross join (values(1,1),(4,21),(5,1),(9,7),(10,12),(11,2),(11,15),(11,20),(12,25)) h(m,d) on conflict do nothing;
insert into blocked_dates values('2026-04-03','Paixão de Cristo'),('2027-03-26','Paixão de Cristo') on conflict do nothing;
