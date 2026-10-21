import { createClient } from '@supabase/supabase-js';
const endpoint = import.meta.env.VITE_PHASE6_URL || 'http://127.0.0.1:55321';
const url = new URL(endpoint);
if (!['127.0.0.1','localhost'].includes(url.hostname) || url.port !== '55321') throw new Error('Phase 6 is restricted to isolated localhost Supabase');
export const db = createClient(endpoint, import.meta.env.VITE_PHASE6_ANON_KEY || 'local-setup-required', {auth:{storageKey:'familyconnect-phase6-local',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
export async function rpc(name,args={}) { const {data,error}=await db.rpc(name,args); if(error) throw new Error(error.message); return data; }
export const act = (action,payload={}) => rpc('fc_action',{action,payload:{...payload,request_id:payload.request_id||crypto.randomUUID()}});
export {graphFrom} from './graph-adapter.mjs';
