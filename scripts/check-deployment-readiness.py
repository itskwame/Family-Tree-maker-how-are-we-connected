import ast,json,urllib.request,urllib.error
from pathlib import Path
from datetime import datetime,timezone
source=ast.parse(Path('scripts/phase6-readonly-probe.py').read_text())
ns={};exec(compile(ast.Module(body=[n for n in source.body if isinstance(n,(ast.Import,ast.ImportFrom,ast.ClassDef,ast.FunctionDef))],type_ignores=[]),'credential-helper','exec'),ns)
base='https://api.supabase.com/v1/projects/jmsntxwkaneluqgnzzim'
headers={'Authorization':'Bearer '+ns['token'](),'Content-Type':'application/json'}
def get(path,query=None):
 req=urllib.request.Request(base+path,headers=headers,method='POST' if query else 'GET',data=json.dumps({'query':query}).encode() if query else None)
 try:
  with urllib.request.urlopen(req,timeout=30) as r:return {'status':r.status,'data':json.load(r)}
 except urllib.error.HTTPError as e:return {'status':e.code,'error':'Read-only inspection failed'}
 except Exception:return {'error':'Read-only endpoint unavailable'}
result={'checkedAt':datetime.now(timezone.utc).isoformat(),'scope':'GET settings and read-only SQL only'}
p=get('');result['project']={k:p.get('data',{}).get(k) for k in ['name','id','status','region']}
a=get('/config/auth');d=a.get('data',{});result['auth']={k:d.get(k) for k in ['site_url','uri_allow_list','mailer_autoconfirm','rate_limit_email_sent','security_captcha_enabled']};result['auth']['custom_smtp_configured']=bool(d.get('smtp_host'));result['auth']['readStatus']=a.get('status')
b=get('/database/backups');d=b.get('data',{});result['recovery']={'readStatus':b.get('status'),'pitr_enabled':d.get('pitr_enabled'),'backup_count':len(d.get('backups',[]))}
query="""select jsonb_build_object('auth_account_count',(select count(*) from auth.users),'family_schema_present',to_regnamespace('familyconnect') is not null,'family_tables',(select coalesce(jsonb_agg(jsonb_build_object('table',c.relname,'rls',c.relrowsecurity)),'[]') from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='familyconnect' and c.relkind='r'),'application_functions',(select coalesce(jsonb_agg(p.proname),'[]') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'fc_%'),'legacy_policies',(select coalesce(jsonb_agg(jsonb_build_object('table',tablename,'name',policyname,'command',cmd,'using',qual,'check',with_check)),'[]') from pg_policies where schemaname='public' and tablename in('families','family_memberships','invites')),'storage_buckets',(select count(*) from storage.buckets)) as readiness"""
result['database']=get('/database/query/read-only',query)
Path('output/deployment-readiness/hosted-inspection.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
