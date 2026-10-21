"""Prepare only local SQL/evidence; never connects to Supabase."""
from pathlib import Path
import json,hashlib,shutil
out=Path('output/hosted-beta');out.mkdir(exist_ok=True)
a=json.loads(Path('output/phase6/private/hosted-schema-audit.json').read_text(encoding='utf8'))[0]['schema_audit']
q=lambda s:'"'+s.replace('"','""')+'"'
lines=['-- SYNTHETIC REHEARSAL ONLY. Reconstructed public application metadata, not hosted data.', 'set search_path=public,extensions;']
tables=[t for t in a['tables'] if t['schema']=='public']
assert {t['name'] for t in tables}=={'families','family_memberships','invites'}
for t in tables:
    cols=[]
    for c in sorted([c for c in a['columns'] if c['schema']=='public' and c['table_name']==t['name']],key=lambda c:c['ordinal']):
        assert not c['identity'] and not c['generated']
        cols.append(q(c['name'])+' '+c['type']+(' default '+c['default_expression'] if c['default_expression'] else '')+(' not null' if c['not_null'] else ''))
    lines.append('create table public.'+q(t['name'])+'('+','.join(cols)+');')
for kind in ['p','u','c','f']:
    for c in a['constraints']:
        if c['schema']=='public' and c['type']==kind:lines.append(f'alter table public.{q(c["table_name"])} add constraint {q(c["name"])} {c["definition"]};')
for i in a['indexes']:
    if i['schema']=='public' and not i['unique_index']:lines.append(i['definition']+';')
for t in tables:
    lines+=['alter table public.'+q(t['name'])+' enable row level security;','grant all on public.'+q(t['name'])+' to anon,authenticated,service_role;']
for p in a['policies']:
    if p['schemaname']=='public':lines.append('create policy '+q(p['policyname'])+' on public.'+q(p['tablename'])+' as '+p['permissive']+' for '+p['cmd']+' to '+','.join(q(r) for r in p['roles'])+(' using ('+p['qual']+')' if p['qual'] else '')+(' with check ('+p['with_check']+')' if p['with_check'] else '')+';')
(out/'observed-legacy-baseline.sql').write_text('\n'.join(lines)+'\n',encoding='utf8')
candidate=Path('migration-review/hosted-beta');candidate.mkdir(parents=True,exist_ok=True)
manifest=[]
for p in sorted(Path('local/phase6/supabase/migrations').glob('*.sql')):
    target=candidate/p.name;shutil.copyfile(p,target)
    manifest.append({'file':str(target).replace('\\','/'),'source':str(p).replace('\\','/'),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
(out/'candidate-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf8')
public={k:[v for v in a[k] if v.get('schema',v.get('schemaname'))=='public'] for k in ['tables','columns','constraints','indexes','foreign_keys','policies','functions','triggers','views','default_grants']}
public['inspection']=a['inspection']
(out/'hosted-public-metadata.json').write_text(json.dumps(public,indent=2),encoding='utf8')
shutil.copyfile('output/phase6/private/hosted-record-counts.json',out/'hosted-counts.json')
ext=json.loads((out/'private/extended-inventory.json').read_text(encoding='utf8'))
(out/'hosted-services.json').write_text(json.dumps({'capturedAt':ext['capturedAt'],'services':ext['services']},indent=2),encoding='utf8')
deps=json.loads(Path('output/demo-audit/private/hosted-prep-dependencies.json').read_text(encoding='utf16'))
(out/'dependency-audit.json').write_text(json.dumps(deps,indent=2),encoding='utf8')
print('Prepared observed legacy DDL and 15 hashed candidate migrations. No database writes.')
