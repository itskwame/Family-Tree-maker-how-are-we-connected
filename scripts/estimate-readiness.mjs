import {writeFileSync} from 'node:fs';
import {estimate} from './cost-model.mjs';
const data={reviewedOn:'2026-11-14',currency:'USD',host:'Netlify static app plus Node image function; not deployed',scenarios:[100,1000,10000].map(n=>estimate(n)),sensitivity:[100,1000,10000].map(n=>estimate(n,1)),notes:['Forecast, not observed billing; 12-month cumulative content, 20% MAU baseline.','Supabase small compute assumed; disk/compute load test and independent recovery still required.','Price excludes domain, tax, backup custody; quoted tier cannot be activated without approval.','Cloudflare alternative is a separate future migration, not the selected host.']};
writeFileSync('output/cost-readiness/estimates.json',JSON.stringify(data,null,2));console.log(JSON.stringify(data.scenarios));
