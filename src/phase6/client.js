import { createClient } from '@supabase/supabase-js';
const endpoint = import.meta.env.VITE_PHASE6_URL || 'http://127.0.0.1:55321';
const url = new URL(endpoint);
if (!['127.0.0.1','localhost'].includes(url.hostname) || url.port !== '55321') throw new Error('Phase 6 is restricted to isolated localhost Supabase');
export const db = createClient(endpoint, import.meta.env.VITE_PHASE6_ANON_KEY || 'local-setup-required', {auth:{storageKey:'familyconnect-phase6-local',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
export async function rpc(name,args={}) { const {data,error}=await db.rpc(name,args); if(error) throw new Error(error.message); return data; }
export const act = (action,payload={}) => rpc('fc_action',{action,payload:{...payload,request_id:crypto.randomUUID()}});
export function graphFrom(snapshot,network) {
 const people=snapshot.people.filter(p=>p.network_id===network).map(p=>({id:p.id,first:p.first_name,last:p.last_name||' ',gender:p.gender,photo:p.photo,born:'',ageClass:p.age_class}));
 const ids=new Set(people.map(p=>p.id));
 return {people,parentages:snapshot.parentages.filter(e=>ids.has(e.parent_id)&&ids.has(e.child_id)).map(e=>({id:e.id,parent:e.parent_id,child:e.child_id,kind:e.kind})),partnerships:snapshot.partnerships.filter(e=>ids.has(e.person_a)&&ids.has(e.person_b)).map(e=>({id:e.id,partners:[e.person_a,e.person_b],kind:'marriage',status:'current'}))};
}
