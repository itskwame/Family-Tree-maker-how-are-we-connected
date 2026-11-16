// Pure SQL preparation only: this module cannot connect to a database.
import {createHash} from 'node:crypto';
export function migrationTransaction(candidates, {failAfter = false} = {}) {
  const statements = ["begin; set local lock_timeout='5s'; set local statement_timeout='120s';",
    "select pg_advisory_xact_lock(611162026);",
    "create schema if not exists familyconnect_migrations; revoke all on schema familyconnect_migrations from public,anon,authenticated;",
    "create table if not exists familyconnect_migrations.ledger(version text primary key,sha256 text not null,applied_at timestamptz not null default now()); revoke all on familyconnect_migrations.ledger from public,anon,authenticated;"];
  const versions = new Set();
  for (const candidate of candidates) {
    const version = candidate.file.split('/').at(-1);
    if (!/^\d{14}_[a-z_]+\.sql$/.test(version) || versions.has(version)) throw Error('Invalid or duplicate migration version');
    versions.add(version);
    if (createHash('sha256').update(candidate.sql).digest('hex') !== candidate.sha256) throw Error('Candidate checksum mismatch');
    if (candidate.sql.includes('$fc_ddl$') || candidate.sql.includes('$fc_apply$')) throw Error('SQL delimiter collision');
    // These two reviewed sources are standalone local migrations. Keep their
    // source hashes, but remove only their known outer transaction boundaries.
    let body = candidate.sql;
    if (['20261113000100_cost_controls.sql','20261114000100_durable_media_reservations.sql'].includes(version)) {
      if ((body.match(/^begin;\s*$/gm) || []).length !== 1 || (body.match(/^commit;\s*$/gm) || []).length !== 1) throw Error('Unexpected transaction boundaries');
      body = body.replace(/^begin;\s*$/m, '').replace(/^commit;\s*$/m, '');
    }
    statements.push(`do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='${version}') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='${version}' and sha256='${candidate.sha256}') then raise exception 'Migration checksum mismatch: ${version}'; end if;
      else
        execute $fc_ddl$${body}$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('${version}','${candidate.sha256}');
      end if;
    end $fc_apply$;`);
  }
  if (failAfter) statements.push('select 1/0;');
  return statements.join('\n') + '\ncommit;\n';
}
