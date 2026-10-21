import { createClient } from '@supabase/supabase-js';
import {demoEnabled,environment,releaseConfig} from './runtime.mjs';
const endpoint=releaseConfig?.url || (demoEnabled?(import.meta.env.VITE_PHASE6_URL || 'http://127.0.0.1:55321'):null);
if(!endpoint)throw new Error('FamilyConnect requires an explicitly configured environment. No sample data is loaded.');
const url=new URL(endpoint);
if(environment==='local-demo'&&(!demoEnabled||!['127.0.0.1','localhost'].includes(url.hostname)||url.port!=='55321'))throw new Error('Development demo requires isolated localhost Supabase');
if(environment==='clean-check'&&(endpoint!=='http://127.0.0.1:56321'||!['127.0.0.1','localhost'].includes(location.hostname)))throw new Error('Clean verification is isolated localhost only');
export const mediaEndpoint=releaseConfig?.media || (demoEnabled?'http://127.0.0.1:5177':'');
export const db=createClient(endpoint,releaseConfig?.key || import.meta.env.VITE_PHASE6_ANON_KEY || 'local-setup-required',{auth:{storageKey:demoEnabled?'familyconnect-phase6-local':`familyconnect-${environment}-${url.host}`,detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
export async function rpc(name,args={}) { const {data,error}=await db.rpc(name,args); if(error) throw new Error(error.message); return data; }
export const act = (action,payload={}) => rpc('fc_action',{action,payload:{...payload,request_id:payload.request_id||crypto.randomUUID()}});
export {graphFrom} from './graph-adapter.mjs';
