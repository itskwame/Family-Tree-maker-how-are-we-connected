import {setup,call,view,savePrivate} from './phase7-fixture.mjs';
import {readFileSync} from 'node:fs';
const f=await setup(`demo-${Date.now()}`),{network:n,people:p,clients:c}=f;
async function photo(who,file,target){const {data}=await c[who].auth.getSession();const r=await fetch('http://127.0.0.1:5177/upload?'+new URLSearchParams(target),{method:'POST',headers:{Origin:'http://127.0.0.1:5176',Authorization:`Bearer ${data.session.access_token}`,'Content-Type':'image/jpeg'},body:readFileSync(`public/family-portraits/${file}.jpg`)});if(!r.ok)throw Error(await r.text());}
await call(c.emma,'save_profile',{person:p.emma,name:'Emma Bennett',bio:'Collector of little moments. Happiest around a table full of family, good food, and stories.',location:'Portland, Oregon',birthday:'04-12',share_bio:true,share_location:true,share_photo:true});
await photo('emma','emma',{person:p.emma});
for(const [who,body,files] of [['david','Three generations, one very happy afternoon. Grateful for the stories, the laughter, and a little time together. 🌿',['david','arthur']],['emma','A small milestone worth celebrating: our family recipe book has its first ten recipes! What should we add next?',['emma']]]){
 const post=(await call(c[who],'create_post',{network:n,person:p[who],body})).id;
 for(const file of files)await photo(who,file,{post});await call(c[who],'publish_post',{id:post});await call(c.maya,'like',{id:post});await call(c[who==='emma'?'david':'emma'],'comment',{id:post,person:p[who==='emma'?'david':'emma'],body:who==='emma'?'Grandma’s apple cake has to be next. ❤️':'Such a lovely afternoon. Let’s do this again soon!'});
}
const dm=(await call(c.emma,'create_chat',{network:n,person:p.emma,target:p.david,kind:'direct',name:'Emma & David'})).id;
await call(c.david,'accept_chat',{id:dm});await call(c.david,'send_message',{id:dm,body:'Do you remember the garden picnics at Grandma’s house?'});await call(c.emma,'send_message',{id:dm,body:'Of course! The apple cake was always the best part. ❤️'});await call(c.david,'send_message',{id:dm,body:'I found her recipe. I’ll bring it on Sunday!'});
const group=(await call(c.emma,'create_chat',{network:n,person:p.emma,kind:'group',name:'Sunday around the table'})).id;
for(const who of ['david','maya']){await call(c.emma,'invite_member',{id:group,target:p[who]});await call(c[who],'accept_chat',{id:group})}
await call(c.emma,'send_message',{id:group,body:'A little space to plan our next family lunch. Sunday at noon? 🌿'});await call(c.david,'send_message',{id:group,body:'Perfect. I’m bringing the apple cake.'});await call(c.maya,'send_message',{id:group,body:'Count me in! I’ll bring something for the garden table. ☀️'});
savePrivate(f);console.log('Fictional social demonstration prepared. Private sign-in details saved locally.');
