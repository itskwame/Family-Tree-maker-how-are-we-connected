import {readFileSync} from 'node:fs';import {sql} from './phase6-local.mjs';
const migration=readFileSync('local/phase6/supabase/migrations/20261114000100_durable_media_reservations.sql','utf8');sql(migration.slice(migration.indexOf('create or replace function'),migration.lastIndexOf('commit;')));console.log('Local accounting guard updated.');
