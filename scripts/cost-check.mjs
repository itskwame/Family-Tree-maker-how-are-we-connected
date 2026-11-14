import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
export function evaluateUsage(policy,snapshot,now=Date.now()){
 const at=Date.parse(snapshot.checkedAt),stale=!Number.isFinite(at)||now-at>policy.maxSnapshotAgeHours*3600000||at>now+300000;
 return Object.entries(policy.limits).map(([metric,limit])=>{const value=snapshot.usage?.[metric],known=typeof value==='number'&&Number.isFinite(value)&&value>=0;return {metric,value:known?value:null,limit,status:!known?'UNKNOWN':stale?'STALE':value>=limit?'LIMIT':value>=limit*policy.criticalFraction?'CRITICAL':value>=limit*policy.warningFraction?'WARNING':'OK'}});
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/cost-check.mjs')){
 const policy=JSON.parse(readFileSync('cost-policy.json','utf8').replace(/^\uFEFF/,''));
 const file=process.argv[process.argv.indexOf('--usage')+1];
 let snapshot;
 if(process.argv.includes('--local')){
  const {sql}=await import('./phase6-local.mjs');
  const row=JSON.parse(sql("select jsonb_build_object('databaseBytes',pg_database_size(current_database()),'storageBytes',(select coalesce(sum((metadata->>'size')::bigint),0) from storage.objects));").trim());
  snapshot={checkedAt:new Date().toISOString(),scope:'isolated local database only; provider usage unknown',usage:row};
 }else if(process.argv.includes('--usage')&&file){snapshot=JSON.parse(readFileSync(file,'utf8'))}
 else throw Error('Use --local or --usage <provider-usage.json>; missing values are never treated as zero.');
 const result={checkedAt:new Date().toISOString(),scope:snapshot.scope,alerts:evaluateUsage(policy,snapshot)};
 mkdirSync('output/cost-controls',{recursive:true});writeFileSync('output/cost-controls/usage-alerts.json',JSON.stringify(result,null,2));
 for(const r of result.alerts)console.log(`${r.status}: ${r.metric} ${r.value??'unavailable'} / ${r.limit}`);
 if(result.alerts.some(r=>r.status!=='OK'))process.exitCode=2;
}
