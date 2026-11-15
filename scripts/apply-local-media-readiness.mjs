import {readFileSync} from 'node:fs';
import {sql} from './phase6-local.mjs';
if(sql("select count(*) from pg_tables where schemaname='familyconnect' and tablename='media_cost_reservations'").trim()==='0')sql(readFileSync('local/phase6/supabase/migrations/20261114000100_durable_media_reservations.sql','utf8'));
console.log('Durable reservations applied locally only.');
