import {sql} from './phase6-local.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';
mkdirSync('output/social-audit',{recursive:true});
const result=sql(`begin read only; select jsonb_build_object('tables',(select jsonb_agg(jsonb_build_object('schema',table_schema,'table',table_name)) from information_schema.tables where table_schema in ('public','familyconnect') and table_type='BASE TABLE'),'people_columns',(select jsonb_agg(column_name) from information_schema.columns where table_schema='familyconnect' and table_name='people'),'storage_bucket_count',(select count(*) from storage.buckets)); rollback;`);
writeFileSync('output/social-audit/local-catalog.json',result.split('\n').find(x=>x.startsWith('{'))+'\n');console.log('Read-only local catalog recorded. No hosted access.');
