"""Fixed-project read-only collection; no role management or general SQL endpoint."""
import contextlib, io, json, runpy, urllib.request, urllib.error
from pathlib import Path
from datetime import datetime, timezone
with contextlib.redirect_stdout(io.StringIO()):
    probe = runpy.run_path('scripts/phase6-readonly-probe.py')
authorization = 'Bearer ' + probe['token']()
base = 'https://api.supabase.com/v1/projects/jmsntxwkaneluqgnzzim/'
def request(path, query=None):
    data = json.dumps({'query':query}).encode() if query else None
    req = urllib.request.Request(base+path, data=data, headers={'Authorization':authorization,'Content-Type':'application/json'}, method='POST' if query else 'GET')
    try:
        with urllib.request.urlopen(req,timeout=45) as response: return {'status':response.status,'data':json.load(response)}
    except urllib.error.HTTPError as e: return {'status':e.code,'error':'Read-only request unavailable'}
    except urllib.error.URLError: return {'error':'Network unavailable'}
query="""select jsonb_build_object(
 'accounts', (select count(*) from auth.users),
 'confirmed_accounts',(select count(*) from auth.users where email_confirmed_at is not null),
 'account_metadata_fingerprint',(select encode(extensions.digest(coalesce(jsonb_agg(jsonb_build_array(id,created_at,email_confirmed_at,role,is_super_admin) order by id)::text,''),'sha256'),'hex') from auth.users),
 'identity_metadata_fingerprint',(select encode(extensions.digest(coalesce(jsonb_agg(jsonb_build_array(id,user_id,provider,created_at) order by id)::text,''),'sha256'),'hex') from auth.identities),
 'extensions',(select jsonb_agg(jsonb_build_object('name',extname,'version',extversion)) from pg_extension),
 'publications',(select jsonb_agg(jsonb_build_object('name',pubname,'all_tables',puballtables)) from pg_publication),
 'publication_tables',(select jsonb_agg(to_jsonb(t)) from pg_publication_tables t),
 'public_types',(select jsonb_agg(jsonb_build_object('name',typname,'kind',typtype)) from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public'),
 'application_dependencies',(select jsonb_agg(jsonb_build_object('dependent',pg_describe_object(d.classid,d.objid,d.objsubid),'referenced',pg_describe_object(d.refclassid,d.refobjid,d.refobjsubid),'type',d.deptype)) from pg_depend d where d.refclassid='pg_class'::regclass and d.refobjid in (select c.oid from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('families','family_memberships','invites')))
) as inventory"""
extra=request('database/query/read-only',query)
services={}
for name,path in [('backups','database/backups'),('postgrest','postgrest'),('auth','config/auth')]:
    r=request(path)
    if 'data' in r:
        d=r['data']
        if name=='auth':
            allowed={'site_url','uri_allow_list','disable_signup','mailer_autoconfirm','smtp_host','smtp_port','smtp_max_frequency','rate_limit_email_sent','rate_limit_token_verifications','rate_limit_sign_in_sign_ups','rate_limit_anonymous_users','security_captcha_enabled'}
            d={k:v for k,v in d.items() if k in allowed}
            if 'smtp_host' in d:d['custom_smtp_configured']=bool(d.pop('smtp_host'))
        elif name=='postgrest': d={k:v for k,v in d.items() if k in {'db_schema','db_extra_search_path','max_rows','db_pool'}}
        elif name=='backups':
            d={k:v for k,v in d.items() if k in {'region','pitr_enabled','physical_backup_data','backups'}}
            if 'backups' in d:d['backups']=[{k:v for k,v in b.items() if k in {'inserted_at','status','is_physical_backup'}} for b in d['backups']]
            d.pop('physical_backup_data',None)
        r['data']=d
    services[name]=r
dest=Path('output/hosted-beta/private');dest.mkdir(parents=True,exist_ok=True)
result={'capturedAt':datetime.now(timezone.utc).isoformat(),'extended':extra,'services':services}
(dest/'extended-inventory.json').write_text(json.dumps(result,indent=2),encoding='utf8')
print(json.dumps({'saved':str(dest/'extended-inventory.json'),'extended_status':extra.get('status'),'services':services},indent=2))
