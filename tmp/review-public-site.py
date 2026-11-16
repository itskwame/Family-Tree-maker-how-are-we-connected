import urllib.request,urllib.error,re,json,concurrent.futures,hashlib
from pathlib import Path
from urllib.parse import urljoin
base='https://howareweconnected.com'
def get(path):
 u=urljoin(base,path)
 try:
  with urllib.request.urlopen(u,timeout=25) as r:return {'path':path,'status':r.status,'url':r.url,'type':r.headers.get('Content-Type'),'server':r.headers.get('Server'),'body':r.read(5000000).decode('utf8','replace')}
 except urllib.error.HTTPError as e:return {'path':path,'status':e.code,'body':''}
 except Exception as e:return {'path':path,'error':type(e).__name__,'body':''}
h=get('/')
assets=sorted(set(re.findall(r'(?:src|href)=["\']([^"\']+\.(?:js|css)(?:\?[^"\']*)?)["\']',h['body'])))
results=list(concurrent.futures.ThreadPoolExecutor(6).map(get,assets+['/.env','/.git/config','/release-manifest.json','/phase6.html','/robots.txt','/sitemap.xml','https://howareweconnected.netlify.app/']))
text=h['body']+'\n'+'\n'.join(x['body'] for x in results if x['path'] in assets)
urls=sorted(set(re.findall(r'https://[a-z0-9-]+\.supabase\.co',text)))
jwts=re.findall(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+',text)
import base64
roles=[]
for token in set(jwts):
 try:
  c=json.loads(base64.urlsafe_b64decode(token.split('.')[1]+'==='));roles.append({'role':c.get('role'),'ref':c.get('ref')})
 except:pass
report={'home':{k:v for k,v in h.items() if k!='body'},'nextjs':'/_next/' in h['body'],'assets':assets,'supabaseUrls':urls,'jwtMetadata':roles,'secretPatternDetected':bool(re.search(r'sb_secret_[A-Za-z0-9]+|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA )?PRIVATE KEY',text)),'sourceMapReferences':re.findall(r'sourceMappingURL=([^\s]+)',text),'linkedRoutes':sorted(set(re.findall(r'href=["\']([^"\']+)',h['body']))),'responses':[{**{k:v for k,v in x.items() if k!='body'},'bytes':len(x['body']),'sameAsHome':x['body']==h['body']} for x in results]}
Path('output/deployment-readiness/public-site-inspection.json').write_text(json.dumps(report,indent=2))
Path('tmp/public-site-bundles.txt').write_text(text,encoding='utf8')
print(json.dumps(report,indent=2))
