import {loadEnv} from 'vite';
const local=loadEnv('phase6',process.cwd(),'VITE_PHASE6_');
const release={...loadEnv('production',process.cwd(),'VITE_FC_'),...process.env};
const old=loadEnv('production',process.cwd(),'VITE_SUPABASE_');
const result={localPublicKeyConfigured:!!local.VITE_PHASE6_ANON_KEY,localEndpoint:local.VITE_PHASE6_URL,hostedReleaseUrlConfigured:!!release.VITE_FC_URL,hostedReleasePublicKeyConfigured:!!release.VITE_FC_ANON_KEY,releaseTargetConfigured:!!release.FAMILYCONNECT_RELEASE_TARGET,legacyHostedUrlPresent:!!old.VITE_SUPABASE_URL,legacyHostedKeyPresent:!!old.VITE_SUPABASE_ANON_KEY};
if(local.VITE_PHASE6_URL==='http://127.0.0.1:55321'&&local.VITE_PHASE6_ANON_KEY){try{const r=await fetch(local.VITE_PHASE6_URL+'/auth/v1/settings',{headers:{apikey:local.VITE_PHASE6_ANON_KEY},signal:AbortSignal.timeout(5000)});result.localAuthKeyCheckHttpStatus=r.status}catch{result.localAuthKeyCheck='Local service unreachable'}}
console.log(JSON.stringify(result));
