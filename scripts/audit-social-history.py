from pathlib import Path
import subprocess,json,re
out=Path('output/social-audit');out.mkdir(parents=True,exist_ok=True)
refs=['1bc35a6^','origin/codex/rebuild-app-with-next.js-and-tailwindcss','HEAD']
paths=['feed/index.html','dashboard/index.html','profile/view.html','profile/edit.html','insights/index.html','events/index.html','js/notifications.js','app/feed/page.js','app/profile/page.js']
evidence=[]
for ref in refs:
 for path in paths:
  r=subprocess.run(['git','show',f'{ref}:{path}'],capture_output=True,text=True,encoding='utf-8')
  if r.returncode:continue
  matches=[]
  for n,line in enumerate(r.stdout.splitlines(),1):
   if re.search(r'createClient|eyJ|supabase\.co',line):continue
   if re.search(r'window\.(createPost|addComment|toggleLike)|async function (loadPosts|loadProfile|loadInsights)|\.from\(|getPublicUrl|familyTimeline|upcomingBirthdays|Recent Activity|No recent activity|comment\.content|media_urls|slice\(0, 10\)|\.order\(|\.limit\(|\.channel\(',line):matches.append({'line':n,'text':line.strip()})
  evidence.append({'ref':ref,'file':path,'lines':matches})
(out/'source-evidence.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
print('Sanitized historical source evidence written; no legacy pages restored or executed.')
