import {chromium,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5176/PHASE-6B-REPORT.html');await page.locator('img').evaluateAll(images=>images.forEach(i=>i.loading='eager'));await expect.poll(()=>page.locator('img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0))).toBeTruthy();
 const account=JSON.parse(readFileSync('output/phase6b/private/desktop-review.json'));
 await page.goto('http://127.0.0.1:5176/phase6.html');await page.getByRole('button',{name:'Explore My Family Connection',exact:true}).click();await page.getByLabel('Email address',{exact:true}).fill(account.email);await page.getByLabel('Password',{exact:true}).fill(account.password);await page.getByRole('button',{name:'Sign in & continue'}).click();await page.locator('svg [data-person]').first().waitFor();
 await page.getByLabel('Family network').selectOption(account.network);await page.getByLabel('Focus on a relative').selectOption({label:'David Bennett'});await page.getByRole('button',{name:'Grow my family',exact:true}).click();await expect(page.getByLabel('First name',{exact:true})).toHaveValue('Return');
 await page.goto('http://127.0.0.1:5176/phase6.html?view=templates');await page.locator('svg [data-person]').first().waitFor();assert.deepEqual(errors,[]);
 writeFileSync('output/phase6b/final-check.json',JSON.stringify({passed:true,checks:['Report screenshots all load','Return login retains guided draft','Existing template entry renders','No runtime errors']},null,2));
}catch(e){await page.screenshot({path:'output/phase6b/private/final-check-failure.png',fullPage:true});throw e}finally{await browser.close()}
