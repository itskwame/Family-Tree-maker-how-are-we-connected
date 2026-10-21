import {chromium,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {setup} from './phase6b-fixture.mjs';
import {client} from './phase6-local.mjs';
const out='output/passwordless';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
async function mailLink(email){for(let n=0;n<60;n++){const box=await fetch('http://127.0.0.1:55324/api/v1/messages').then(r=>r.json());const m=box.messages?.find(m=>m.To?.some(t=>t.Address===email));if(m){const body=await fetch('http://127.0.0.1:55324/api/v1/message/'+m.ID).then(r=>r.json());const link=(body.Text||body.HTML).match(/http:\/\/127\.0\.0\.1:55321\/auth\/v1\/verify[^\s"<>]+/)?.[0]?.replaceAll('&amp;','&');if(link)return link}await new Promise(r=>setTimeout(r,250))}throw Error('Local email not received')}
try{for(const [mode,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
 const f=await setup('email-'+mode),ctx=await browser.newContext({viewport}),page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5176/phase6.html#invite='+f.token);await page.getByRole('button',{name:'Explore My Family Connection',exact:true}).click();await page.getByRole('button',{name:'Continue with an email link',exact:true}).click();await expect(page.getByLabel('Password',{exact:true})).toHaveCount(0);await page.getByLabel('Email address',{exact:true}).fill(f.email);await page.screenshot({path:`${out}/${mode}-email-link.png`,fullPage:true});await page.getByRole('button',{name:'Email me a sign-in link',exact:true}).click();await page.getByRole('status').filter({hasText:'Check your email inbox'}).waitFor();await expect(page.getByRole('button',{name:/Request again in/})).toBeDisabled();
 const verification=await mailLink(f.email);assert.equal(new URL(verification).origin,'http://127.0.0.1:55321');
 if(mode==='desktop'){const tab=await ctx.newPage();await tab.goto(verification);await expect(page.getByRole('button',{name:'Confirm identity & reveal my connection'})).toBeVisible();await tab.close()}else await page.goto(verification);
 await page.getByRole('button',{name:'Confirm identity & reveal my connection'}).click();await page.getByRole('heading',{name:/Emma is David/}).waitFor();await page.locator('svg [data-person]').first().waitFor();await page.screenshot({path:`${out}/${mode}-reveal.png`,fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
 results.push({name:`${mode}: email-only new account, cooldown, verified session, invitation continuation, explicit claim and confirmed reveal`,status:'passed',continuation:mode==='desktop'?'Email verified in a second tab; original invitation tab resumes':'Same-tab email verification'});
 const replay=new URL(verification);const token_hash=replay.searchParams.get('token'),type=replay.searchParams.get('type');const used=await client().auth.verifyOtp({token_hash,type});assert(used.error);results.push({name:`${mode}: consumed email verification token cannot be replayed`,status:'passed'});
 await ctx.close();
 }
 // Incorrect/expired-token path must never establish an authenticated session.
 const invalid=await client().auth.verifyOtp({token_hash:'0'.repeat(64),type:'magiclink'});assert(invalid.error);assert.equal(invalid.data.session,null);results.push({name:'Invalid email verification token rejected',status:'passed'});
}catch(e){results.push({name:'Passwordless journey',status:'failed',error:e.message});console.error(e.message);process.exitCode=1}finally{await browser.close();writeFileSync(`${out}/results.json`,JSON.stringify({at:new Date().toISOString(),results},null,2))}
