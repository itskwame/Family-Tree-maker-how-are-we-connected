exec(open('tmp/review-public-site.py').read().split("h=get('/')")[0])
paths=['/auth/login.html','/auth/signup.html']
r=list(concurrent.futures.ThreadPoolExecutor(4).map(get,paths))
for x in r:
 print(json.dumps({'path':x['path'],'status':x.get('status'),'sameAsHome':x['body']==Path('tmp/public-site-review.html').read_text(encoding='utf8'),'assets':re.findall(r'<script[^>]+src=["\']([^"\']+)',x['body']),'links':re.findall(r'href=["\']([^"\']+)',x['body'])}))
 Path('tmp/'+x['path'].split('/')[-1]).write_text(x['body'],encoding='utf8')
