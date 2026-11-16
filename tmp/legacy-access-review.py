import ast,json,urllib.request,urllib.error,re
from pathlib import Path
s=ast.parse(Path('scripts/phase6-readonly-probe.py').read_text());ns={};exec(compile(ast.Module(body=[n for n in s.body if isinstance(n,(ast.Import,ast.ImportFrom,ast.ClassDef,ast.FunctionDef))],type_ignores=[]),'helper','exec'),ns)
def req(url,token=None,key=None):
 h={}
 if token:h['Authorization']='Bearer '+token
 if key:h['apikey']=key
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers=h),timeout=25) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,{}
 except Exception as e:return type(e).__name__,{}
t=ns['token']();base='https://api.supabase.com/v1/projects';out={}
status,projects=req(base,t);out['projectListStatus']=status;out['legacyInAuthorizedProjectList']=any(p.get('id')=='fvfviudlxyumnskakftp' for p in projects) if isinstance(projects,list) else None
for ref in ['fvfviudlxyumnskakftp','jmsntxwkaneluqgnzzim']:
 status,p=req(base+'/'+ref,t);out[ref]={'managementStatus':status,'project':{k:p.get(k) for k in ['id','name','status']} if status==200 else None}
ref='jmsntxwkaneluqgnzzim';status,keys=req(base+'/'+ref+'/api-keys?reveal=false',t);out['keyListStatus']=status
local={}
for line in Path('.env').read_text().splitlines():
 if '=' in line:
  k,v=line.split('=',1);local[k.strip()]=v.strip().strip('\"\'')
old=local.get('VITE_SUPABASE_ANON_KEY','');out['localKeyLength']=len(old);out['localKeyContainsWhitespace']=bool(re.search(r'\s',old));out['publicKeyChecks']=[]
if isinstance(keys,list):
 for k in keys:
  if k.get('type')=='publishable' or k.get('name')=='anon':
   value=k.get('api_key','');status,_=req('https://'+ref+'.supabase.co/auth/v1/settings',key=value)
   out['publicKeyChecks'].append({'type':k.get('type'),'name':k.get('name'),'matchesLocal':value==old,'authStatus':status,'valueAvailable':bool(value)})
status,_=req('https://'+ref+'.supabase.co/auth/v1/settings',key=old);out['localKeyAuthStatus']=status
Path('output/deployment-readiness/legacy-access-key-review.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
