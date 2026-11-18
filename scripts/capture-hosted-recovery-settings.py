"""GET-only companion settings backup, saved exclusively in the restricted vault."""
import ast,json,os,urllib.request,urllib.error
from pathlib import Path
from datetime import datetime,timezone
ref='jmsntxwkaneluqgnzzim'
vault=Path(os.environ['LOCALAPPDATA'])/'FamilyConnect'/'Recovery'/ref
run=Path(json.loads((vault/'latest-capture.json').read_text())['runDir'])
assert run.resolve().is_relative_to(vault.resolve())
source=ast.parse(Path('scripts/phase6-readonly-probe.py').read_text(encoding='utf8'))
nodes=[n for n in source.body if isinstance(n,(ast.Import,ast.ImportFrom,ast.ClassDef)) or isinstance(n,ast.FunctionDef) and n.name=='token']
scope={};exec(compile(ast.Module(body=nodes,type_ignores=[]),'<credential-accessor>','exec'),scope)
headers={'Authorization':'Bearer '+scope['token']()}
results={}
for name,path in [('auth','config/auth'),('api','postgrest'),('ssl','ssl-enforcement'),('functions','functions'),('secret_metadata','secrets'),('network','network-restrictions'),('backups','database/backups')]:
    req=urllib.request.Request(f'https://api.supabase.com/v1/projects/{ref}/{path}',headers=headers,method='GET')
    try:
        with urllib.request.urlopen(req,timeout=30) as response:
            data=json.load(response);status=response.status
        (run/f'settings-{name}.json').write_text(json.dumps(data,indent=2),encoding='utf8')
        results[name]={'status':status,'captured':True}
        if name in ('functions','secret_metadata') and isinstance(data,list):results[name]['count']=len(data)
    except urllib.error.HTTPError as error:results[name]={'status':error.code,'captured':False}
    except urllib.error.URLError:results[name]={'captured':False,'error':'network unavailable'}
summary={'at':datetime.now(timezone.utc).isoformat(),'project':ref,'results':results,'limitations':['Secret metadata contains hashes, not recoverable plaintext values','No hosted signing keys or service passwords are changed or activated','Platform infrastructure is not reproduced by a PostgreSQL dump']}
(run/'settings-manifest.json').write_text(json.dumps(summary,indent=2),encoding='utf8')
print(json.dumps(summary,indent=2))
