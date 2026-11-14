import {mkdirSync,writeFileSync} from 'node:fs';
export function estimate(registered,activeFraction=.2){
 const mau=Math.round(registered*activeFraction),storageGB=(registered*.4*.18+mau*2*.18*12)/1000,databaseGB=.07+registered*.00002+mau*.000103*12,emails=Math.ceil(2*mau+.05*registered),egressGB=mau*.012;
 const supabase=storageGB>.8||databaseGB>.4||egressGB>4?25+Math.max(0,databaseGB-8)*.125+Math.max(0,storageGB-100)*.0213+Math.max(0,egressGB-250)*.09:0;
 const mail=emails>3000?20+Math.max(0,emails-50000)/1000*.9:0;
 const workerCredits=60+mau*2/3600*10+mau*2*.0005*20+mau*2/10000*2,workerUSD=workerCredits>300?9:0;
 return {registered,mau,activeFraction,storageGB,databaseGB,emailsPerMonth:emails,uncachedEgressGB:egressGB,realtimeMessages:mau*170,peakConnections:Math.ceil(mau*.05),netlifyCombinedCredits:60+mau*4*.002*20+mau*4*20/10000*2+mau*2/3600*10+mau*2*.0005*20,estimatedMonthlyUSD:Number((supabase+mail+workerUSD).toFixed(2)),supabaseUSD:Number(supabase.toFixed(2)),emailUSD:Number(mail.toFixed(2)),workerUSD,workerCredits};
}
const scenarios=[100,1000,10000].map(n=>estimate(n)),sensitivity=[100,1000,10000].map(n=>estimate(n,1));
mkdirSync('output/cost-controls',{recursive:true});
writeFileSync('output/cost-controls/estimates.json',JSON.stringify({reviewedOn:'2026-11-13',currency:'USD',basis:'12 months cumulative media and messages; no content deletion assumed; static host and image worker free-tier assumptions are conditional, not a deployed quote; taxes/domain/backup custody/labor excluded',scenarios,sensitivity},null,2));
console.log(JSON.stringify({scenarios,sensitivity},null,2));
