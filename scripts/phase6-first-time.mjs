import {chromium} from '@playwright/test';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {sql,uuid,ids,password} from './phase6-local.mjs';
const accounts=JSON.parse(readFileSync('output/phase6/private/local-fixture-accounts.json'));
const id=randomUUID(),token=randomBytes(32).toString('hex'),email=`alex-${Date.now()}@example.test`;
sql(`begin; insert into familyconnect.people(id,network_id,first_name,last_name,age_class,gender) values('${id}','${ids.network}','Alex','Bennett','adult','other'); insert into familyconnect.parentages(network_id,parent_id,child_id,kind) values('${ids.network}','${uuid('david')}','${id}','biological'); insert into familyconnect.invitations(token_hash,network_id,target_id,inviter_id,recipient_email,created_by,approved_by) values('${createHash('sha256').update(token).digest('hex')}','${ids.network}','${id}','${uuid('david')}','${email}','${accounts.david}','${accounts.reviewer}'); commit;`);
const mobileMode=process.argv.includes('--mobile');
const browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:mobileMode?{width:390,height:844}:{width:1440,height:1000},isMobile:mobileMode});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const started=performance.now();let deliveryWaitMs=0;
try{
 await page.goto('http://127.0.0.1:5176/phase6.html#invite='+token);await page.getByRole('button',{name:'Explore My Family Connection',exact:true}).click();await page.getByRole('button',{name:'New here? Create an account'}).click();await page.getByLabel('Email address',{exact:true}).fill(email);await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Create account',exact:true}).click();await page.getByText('Check your email inbox',{exact:false}).waitFor();
 const waitStart=performance.now();let verification;
 for(let i=0;i<40;i++){const list=await fetch('http://127.0.0.1:55324/api/v1/messages').then(r=>r.json());const message=list.messages?.find(m=>m.To?.some(t=>t.Address===email));if(message){const body=await fetch('http://127.0.0.1:55324/api/v1/message/'+message.ID).then(r=>r.json());verification=(body.Text||body.HTML).match(/http:\/\/127\.0\.0\.1:55321\/auth\/v1\/verify[^\s"<>]+/)?.[0]?.replaceAll('&amp;','&');if(verification)break}await page.waitForTimeout(250)}
 deliveryWaitMs=performance.now()-waitStart;assert(verification,'Local verification email missing');
 await page.goto(verification);await page.getByRole('button',{name:'Confirm identity & reveal my connection'}).click();await page.getByRole('heading',{name:/Alex is David/}).waitFor();await page.locator('svg [data-person]').first().waitFor();
 const completed=performance.now()-started;await page.screenshot({path:mobileMode?'output/phase6/screenshots/09-mobile-first-time.png':'output/phase6/screenshots/07-first-time-verified-reveal.png',fullPage:true});
 assert(await page.locator('[data-highlighted="true"]').count()>0);assert.equal(errors.length,0);
 writeFileSync(mobileMode?'output/phase6/first-time-mobile-results.json':'output/phase6/first-time-results.json',JSON.stringify({passed:true,totalMs:completed,emailWaitMs:deliveryWaitMs,excludingEmailWaitMs:completed-deliveryWaitMs,note:'Actual automated new-account signup, local email verification, claim and reveal; not a human usability timing claim',errors},null,2));
 if(mobileMode){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await browser.close();process.exit(0)}
 // Refresh the visual evidence after the mobile centering fix, using the original fictional Emma account.
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByRole('button',{name:'Explore My Family Connection',exact:true}).click();await page.getByLabel('Email address',{exact:true}).fill('emma@example.test');await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'Sign in & continue'}).click();await page.locator('svg [data-person]').first().waitFor();await page.waitForTimeout(500);await page.screenshot({path:'output/phase6/screenshots/02-desktop-connection.png',fullPage:true});
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true});await mobile.addInitScript(storage=>{for(const[k,v]of Object.entries(storage))localStorage.setItem(k,v)},await page.evaluate(()=>({...localStorage})));
 const mp=await mobile.newPage();await mp.goto('http://127.0.0.1:5176/phase6.html');await mp.locator('svg [data-person]').first().waitFor();await mp.waitForTimeout(700);await mp.screenshot({path:'output/phase6/screenshots/05-mobile-connection.png',fullPage:true});
 const bounds=await mp.locator(`[data-person="${uuid('emma')}"]`).boundingBox();const panel=await mp.locator('.tree-scroll').boundingBox();assert(bounds.x>=panel.x-1&&bounds.x+bounds.width<=panel.x+panel.width+1,'Mobile focused person must be horizontally visible');
 await mp.getByRole('button',{name:'Grow my family',exact:true}).click();await mp.screenshot({path:'output/phase6/screenshots/06-mobile-builder.png',fullPage:true});
 await page.getByRole('button',{name:'Family branches',exact:true}).click();await page.screenshot({path:'output/phase6/screenshots/08-network-consent.png',fullPage:true});
}catch(e){console.error(e);await page.screenshot({path:'output/phase6/screenshots/first-time-failure.png',fullPage:true});writeFileSync('output/phase6/first-time-results.json',JSON.stringify({passed:false,error:e.message,errors},null,2));process.exitCode=1}finally{await browser.close()}
