import {allowedPortrait} from './runtime.mjs';
export function graphFrom(snapshot,network) {
 const people=snapshot.people.filter(p=>p.network_id===network).map(p=>({id:p.id,first:p.first_name,last:p.last_name||' ',gender:p.gender,photo:allowedPortrait(p.photo),born:'',dateLabel:'',familyLabel:snapshot.networks.find(n=>n.id===network)?.name||'',ageClass:p.age_class}));
 const ids=new Set(people.map(p=>p.id));
 return {people,parentages:snapshot.parentages.filter(e=>ids.has(e.parent_id)&&ids.has(e.child_id)).map(e=>({id:e.id,parent:e.parent_id,child:e.child_id,kind:e.kind})),partnerships:snapshot.partnerships.filter(e=>ids.has(e.person_a)&&ids.has(e.person_b)).map(e=>({id:e.id,partners:[e.person_a,e.person_b],kind:e.kind,status:e.status}))};
}
