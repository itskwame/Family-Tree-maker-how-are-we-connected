alter table familyconnect.partnerships add column kind text not null default 'marriage' check(kind in ('marriage','partnership'));
alter table familyconnect.partnerships add column status text not null default 'partnered' check(status in ('partnered','former'));
