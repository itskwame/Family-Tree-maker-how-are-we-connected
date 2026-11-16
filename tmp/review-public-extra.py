exec(open('tmp/review-public-site.py').read().split("h=get('/')")[0])
paths=['/business/','/family/invites','/family/manage','/feed/','/map/','/profile/view','/tree/builder','/netlify.toml','/next.config.js']
report=[]
for x in concurrent.futures.ThreadPoolExecutor(5).map(get,paths):
 s=x['body'];home=s==Path('tmp/public-site-review.html').read_text(encoding='utf8')
 item={'path':x['path'],'status':x.get('status'),'type':x.get('type'),'bytes':len(s),'homeFallback':home,'supabaseRefs':sorted(set(re.findall(r'https://([a-z0-9-]+)\.supabase\.co',s))),'secretPattern':bool(re.search(r'sb_secret_|service_role|PRIVATE KEY',s)),'scriptSources':re.findall(r'<script[^>]+src=["\']([^"\']+)',s)}
 report.append(item)
 if not home:Path('tmp/public-extra-'+re.sub('[^a-zA-Z]','_',x['path'])+'.txt').write_text(s,encoding='utf8')
Path('output/deployment-readiness/public-extra-routes.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
