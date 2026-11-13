import {readFileSync} from 'node:fs';
import {sql} from './phase6-local.mjs';
const name='20261113000100_cost_controls.sql';
if(sql("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='familyconnect' and p.proname='cost_media_limit'").trim()!=='0')throw Error('Cost migration already applied locally');
sql(readFileSync('local/phase6/supabase/migrations/'+name,'utf8'));
console.log('Cost controls applied to isolated local database only.');
