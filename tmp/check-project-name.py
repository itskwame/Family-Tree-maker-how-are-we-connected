import ast,json,urllib.request
from pathlib import Path
source=ast.parse(Path('scripts/phase6-readonly-probe.py').read_text())
parts=[n for n in source.body if isinstance(n,(ast.Import,ast.ImportFrom,ast.ClassDef,ast.FunctionDef))]
ns={}
exec(compile(ast.Module(body=parts,type_ignores=[]),'credential-helper','exec'),ns)
req=urllib.request.Request('https://api.supabase.com/v1/projects/jmsntxwkaneluqgnzzim',headers={'Authorization':'Bearer '+ns['token']()},method='GET')
with urllib.request.urlopen(req,timeout=30) as r:data=json.load(r)
print(json.dumps({k:data.get(k) for k in ['name','id','region','status']}))
