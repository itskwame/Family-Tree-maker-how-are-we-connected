exec(open('tmp/review-public-site.py').read().split("h=get('/')")[0])
paths=['/dashboard/index.html','/onboarding/welcome.html','/auth/login','/auth/signup','/package.json','/src/main.jsx']
r=list(concurrent.futures.ThreadPoolExecutor(5).map(get,paths))
report=[]
for x in r:
 s=x['body'];item={k:v for k,v in x.items() if k!='body'};item.update(bytes=len(s),sameAsHome=s==Path('tmp/public-site-review.html').read_text(encoding='utf8'),scripts=re.findall(r'<script[^>]+src=["\']([^"\']+)',s),supabaseUrls=sorted(set(re.findall(r'https://[a-z0-9-]+\.supabase\.co',s))),links=sorted(set(re.findall(r'href=["\']([^"\']+)',s))),sensitivePattern=bool(re.search(r'sb_secret_|service_role|PRIVATE KEY|Fictional-Phase6-Only',s)))
 report.append(item)
 if x['path'] in paths[:2]:Path('tmp/public-'+x['path'].split('/')[-2]+'.html').write_text(s,encoding='utf8')
Path('output/deployment-readiness/public-routes.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
