"""Fixed-project read-only preflight; no row values or secrets are printed/saved."""
import ast
import json
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timezone

# Reuse only the existing credential accessor, not the old probe's entrypoint.
source = ast.parse(Path('scripts/phase6-readonly-probe.py').read_text(encoding='utf8'))
nodes = [n for n in source.body if isinstance(n, (ast.Import, ast.ImportFrom, ast.ClassDef))
         or (isinstance(n, ast.FunctionDef) and n.name == 'token')]
namespace = {}
exec(compile(ast.Module(body=nodes, type_ignores=[]), '<credential-accessor>', 'exec'), namespace)
authorization = 'Bearer ' + namespace['token']()
base = 'https://api.supabase.com/v1/projects/jmsntxwkaneluqgnzzim/'

def request(path, query=None):
    data = json.dumps({'query': query}).encode() if query else None
    req = urllib.request.Request(base + path, data=data,
        headers={'Authorization': authorization, 'Content-Type': 'application/json'},
        method='POST' if query else 'GET')
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, None
    except urllib.error.URLError:
        raise SystemExit('Network unavailable; no hosted settings or credentials changed.')

query = """select json_build_object(
'server_version',current_setting('server_version'),
'read_role',current_user,
'auth_users',(select count(*) from auth.users),
'auth_identities',(select count(*) from auth.identities),
'confirmed_users',(select count(*) from auth.users where email_confirmed_at is not null),
'legacy_families',(select count(*) from public.families),
'legacy_memberships',(select count(*) from public.family_memberships),
'legacy_invites',(select count(*) from public.invites),
'storage_buckets',(select count(*) from storage.buckets),
'storage_objects',(select count(*) from storage.objects),
'schemas',(select json_agg(nspname order by nspname) from pg_namespace where nspname not like 'pg_%' and nspname<>'information_schema')
) as inventory"""
status, inventory = request('database/query/read-only', query)
backup_status, backups = request('database/backups')
auth_status, auth = request('config/auth')
pooler_status, poolers = request('database/pooler')
result = {'at': datetime.now(timezone.utc).isoformat(), 'project': 'jmsntxwkaneluqgnzzim',
 'read_api_status': status, 'inventory': inventory,
 'backup_api_status': backup_status,
 'listed_backup_count': len(backups.get('backups', [])) if isinstance(backups, dict) else None,
 'pitr_enabled': backups.get('pitr_enabled') if isinstance(backups, dict) else None,
 'auth_config_status': auth_status,
 'auth_configuration': {k: auth.get(k) for k in ['site_url', 'uri_allow_list', 'disable_signup', 'mailer_autoconfirm']} if isinstance(auth, dict) else None,
 'pooler_api_status': pooler_status,
 'database_password_found': False,
 'recovery_proven': False,
 'blocker': 'No existing PostgreSQL password/connection credential found; Management API access is not a tested pg_dump connection.'}
# Connection endpoint metadata only: never connection strings/password fields.
if isinstance(poolers, list):
    result['pooler_endpoints'] = [{k: p.get(k) for k in ['database_type', 'db_host', 'db_port', 'db_user', 'pool_mode']} for p in poolers]
Path('output/hosted-beta/hosted-recovery-access.json').write_text(json.dumps(result, indent=2), encoding='utf8')
print(json.dumps(result, indent=2))
