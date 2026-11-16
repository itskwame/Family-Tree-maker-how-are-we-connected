import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {chromium} from '@playwright/test';
import {admin,cfg,rpc} from './beta-final-local.mjs';
// A local-only harness with demo behavior disabled; not a release build target.
const server=await createServer({configFile:false,plugins:[react()],define:{__FAMILYCONNECT_DEMO__:'false',__FAMILYCONNECT_ENV__:JSON.stringify('local-security-test'),__FAMILYCONNECT_CONFIG__:JSON.stringify({url:cfg.API_URL,key:cfg.ANON_KEY,media:''})},worker:{format:'es'},server:{host:'127.0.0.1',port:5296,strictPort:true}});
await server.listen();const browser=await chromium.launch({channel:'chrome',headless:true});const checks=[];
try{
 for(const width of [1280,390]){
  const email=`onboarding-${width}-${Date.now()}@example.test`,password=randomUUID()+'aA!9';
  const r=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.ifError(r.error);
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
  await page.goto('http://127.0.0.1:5296/phase6.html');
  await page.evaluate(async({email,password})=>{const {db}=await import('/src/phase6/client.js');const r=await db.auth.signInWithPassword({email,password});if(r.error)throw Error(r.error.message)},{email,password});
  await page.getByRole('heading',{name:'Private beta approval required'}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Create my network and become administrator'}).count(),0);
  await rpc(admin,'fc_beta_authorize',{target:r.data.user.id,approved:true,allow_found:true,reason:'Local browser onboarding test'});
  await page.getByRole('button',{name:'Check approval again'}).click();
  await page.getByRole('heading',{name:'Start your approved family network'}).waitFor();
  await page.getByLabel('Family network name').fill('Browser family');await page.getByLabel('Your first name').fill('Local');await page.getByLabel('Your last name').fill('Owner');
  await page.getByRole('button',{name:'Create my network and become administrator'}).click();
  assert.equal(await page.getByRole('heading',{name:'Start your approved family network'}).count(),1);
  await page.getByRole('checkbox').check();
  await page.screenshot({path:`output/hosted-beta/final/onboarding-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:'Create my network and become administrator'}).click();
  await page.getByRole('heading',{name:'Start your approved family network'}).waitFor({state:'detached'});
  await page.getByRole('button',{name:'My connection',exact:true}).waitFor();
  checks.push({name:`${width}px: fail-closed approval gate and explicit founder confirmation complete`,passed:true});await context.close();
 }
 writeFileSync('output/hosted-beta/final/onboarding-browser-results.json',JSON.stringify({checks},null,2));console.log('PASS desktop/mobile explicit beta onboarding');
}finally{await browser.close();await server.close()}
