import ast,json,urllib.request
from pathlib import Path
from datetime import datetime,timezone
source=ast.parse(Path('scripts/phase6-readonly-probe.py').read_text())
parts=[n for n in source.body if isinstance(n,(ast.Import,ast.ImportFrom,ast.ClassDef,ast.FunctionDef))]
ns={}
exec(compile(ast.Module(body=parts,type_ignores=[]),'credential-helper','exec'),ns)
req=urllib.request.Request('https://api.supabase.com/v1/projects/jmsntxwkaneluqgnzzim/config/auth',headers={'Authorization':'Bearer '+ns['token']()},method='GET')
with urllib.request.urlopen(req,timeout=30) as r: data=json.load(r)
result={'checkedAt':datetime.now(timezone.utc).isoformat(),'method':'GET config/auth only','custom_smtp_configured':bool(data.get('smtp_host'))}
for k in ['site_url','uri_allow_list','smtp_port','mailer_autoconfirm','rate_limit_email_sent']:result[k]=data.get(k)
Path('output/passwordless').mkdir(exist_ok=True)
Path('output/passwordless/hosted-email-config.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result))
