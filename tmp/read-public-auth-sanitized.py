import re,json,base64
from pathlib import Path
for p in ['tmp/login.html','tmp/signup.html']:
 s=Path(p).read_text(encoding='utf8')
 for t in re.findall(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+',s):
  try:
   c=json.loads(base64.urlsafe_b64decode(t.split('.')[1]+'==='));print(json.dumps({'file':p,'role':c.get('role'),'ref':c.get('ref')}))
  except:pass
 s=re.sub(r'eyJ[A-Za-z0-9_.-]+','[REDACTED PUBLIC TOKEN]',s)
 print(s[s.find('<script'):])
