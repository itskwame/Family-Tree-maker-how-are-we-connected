export function estimate(registered,activeFraction=.2,options={}){
 const months=options.months??12,photoKB=options.photoKB??180,uploads=options.uploads??2,views=options.views??120;
 const mau=Math.round(registered*activeFraction),storageGB=(registered*.4*photoKB+mau*uploads*photoKB*months)/1e6;
 const databaseGB=.07+registered*.00002+mau*.000103*months;
 // 70% thumbnails at 20 KB, 30% full photographs, plus 3 MB API/chat traffic.
 const egressGB=mau*(views*(.7*20+.3*photoKB)/1000+3)/1000;
 const emails=Math.ceil(2*mau+.05*registered),realtimeMessages=mau*170,peakConnections=Math.ceil(mau*.05);
 const pro=storageGB>.8||databaseGB>.4||egressGB>4||mau>50000||peakConnections>160;
 const supabase=pro?25+Math.max(0,databaseGB-8)*.125+Math.max(0,storageGB-100)*.0213+Math.max(0,egressGB-250)*.09:0;
 const mail=emails>3000?20+Math.ceil(Math.max(0,emails-50000)/1000)*.9:0;
 const workerCredits=60+mau*uploads/3600*10+mau*uploads*.0005*20+mau*uploads/10000*2;
 const netlifyCredits=workerCredits+mau*4*.002*20+mau*4*20/10000*2;
 const host=netlifyCredits<=300?0:netlifyCredits<=1000?9:netlifyCredits<=3000?20:null;
 const alternativeHost=workerCredits<=300?0:workerCredits<=1000?9:workerCredits<=3000?20:null;
 return {registered,mau,activeFraction,months,photoKB,uploads,storageGB,databaseGB,uncachedEgressGB:egressGB,emailsPerMonth:emails,realtimeMessages,peakConnections,netlifyCredits,workerCredits,supabaseUSD:Number(supabase.toFixed(2)),emailUSD:mail,hostingUSD:host,estimatedMonthlyUSD:host===null?null:Number((supabase+mail+host).toFixed(2)),alternativeStaticHostingUSD:alternativeHost===null?null:Number((supabase+mail+alternativeHost).toFixed(2)),monthsUntilPhotoCeiling:Math.max(0,(800-registered*.4*photoKB/1000)/(mau*uploads*photoKB/1000))};
}
