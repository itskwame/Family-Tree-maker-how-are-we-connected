import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import {copyFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
export function releaseConfig(mode){
 const env={...loadEnv(mode,process.cwd(),'VITE_FC_'),...process.env};
 const clean=mode==='cleancheck',target=clean?'clean-check':env.FAMILYCONNECT_RELEASE_TARGET;
 if(!['clean-check','private-beta','production'].includes(target))throw Error('Release build blocked: explicitly configure FAMILYCONNECT_RELEASE_TARGET and reviewed release endpoints. Local demos are not deployment artifacts.');
 const endpoint=env.VITE_FC_URL,key=env.VITE_FC_ANON_KEY;
 if(!endpoint||!key)throw Error('Release build blocked: explicit release Supabase URL and public anon key required. No development fallback.');
 let publicKey=key.startsWith('sb_publishable_');
 try{publicKey||=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role==='anon';}catch{}
 if(!publicKey)throw Error('Release build blocked: only a public anon/publishable key is allowed; never a service-role or secret key.');
 const u=new URL(endpoint);
 if(clean?endpoint!=='http://127.0.0.1:56321':u.protocol!=='https:'||['localhost','127.0.0.1'].includes(u.hostname))throw Error('Release endpoint is not allowed for this build target.');
 if(env.VITE_FC_ENABLE_DEMO||env.FAMILYCONNECT_DEMO)throw Error('Demonstration flags are forbidden in release builds.');
 const media=env.VITE_FC_MEDIA_URL||'';
 if(media&&!clean&&(new URL(media).protocol!=='https:'||['localhost','127.0.0.1'].includes(new URL(media).hostname)))throw Error('Release media endpoint must use remote HTTPS.');
 const outDir=clean?'dist-cleancheck':'dist-release';
 return defineConfig({plugins:[react(),{name:'release-data-boundary',enforce:'post',generateBundle(_options,bundle){
  for(const item of Object.values(bundle))if(item.type==='chunk')for(const id of Object.keys(item.modules))if(/(?:fixture(?:100|300)?\.(?:js|mjs)|premium-samples\.js|FamilyPrototype\.jsx|\/scripts\/|\/output\/|\/src\/pages\/)/.test(id.replaceAll('\\','/')))throw Error('Release contains prohibited demonstration or legacy module: '+id);
 },closeBundle(){copyFileSync(resolve(outDir,'phase6.html'),resolve(outDir,'index.html'));writeFileSync(resolve(outDir,'release-manifest.json'),JSON.stringify({environment:target,demonstrations:false,publicAssetsCopied:false,deployable:!clean},null,2));}}],
 publicDir:false,envPrefix:'VITE_FC_',define:{__FAMILYCONNECT_DEMO__:'false',__FAMILYCONNECT_ENV__:JSON.stringify(target),__FAMILYCONNECT_CONFIG__:JSON.stringify({url:endpoint,key,media})},worker:{format:'es'},build:{outDir,rollupOptions:{input:'phase6.html'}},preview:{host:'127.0.0.1',port:5186,strictPort:true}});
}
