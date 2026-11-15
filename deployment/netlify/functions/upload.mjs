import {createMediaHandler,hostedMediaConfig} from '../../../server/media-handler.mjs';
let handler;
export default async request=>{
 try{handler ||= createMediaHandler(hostedMediaConfig(process.env));}
 catch{return new Response(JSON.stringify({error:'Photo uploads are not configured'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}
 return handler(request);
};
