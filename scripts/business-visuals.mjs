import {chromium,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const f=JSON.parse(readFileSync('output/business/private/demo.json')),browser=await chromium.launch({channel:'chrome',headless:true}),checks=[];
try{for(const [label,viewport] of [['desktop',{width:1440,height:1050}],['mobile',{width:390,height:844}]]){
 const context=await browser.newContext({viewport,isMobile:label==='mobile'}),page=await context.newPage();
 await page.goto('http://127.0.0.1:5176/phase6.html');await page.getByRole('button',{name:'Explore My Family Connection',exact:true}).click();await page.getByLabel('Email address',{exact:true}).fill(f.accounts.emma.email);await page.getByLabel('Password',{exact:true}).fill(f.password);await page.getByRole('button',{name:'Sign in & continue'}).click();await page.getByRole('button',{name:'Family Businesses',exact:true}).click();await expect(page.locator('.business-card img')).toHaveCount(4);
 await page.screenshot({path:`output/business/screenshots/${label}-01-directory.png`,fullPage:true});await page.screenshot({path:`output/business/screenshots/${label}-00-starting-view.png`});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.getByRole('button',{name:'Bennett Kitchen',exact:true}).click();await expect(page.locator('.business-gallery img')).toHaveCount(1);await page.screenshot({path:`output/business/screenshots/${label}-02-business-detail.png`,fullPage:true});
 await page.getByRole('button',{name:'How is Emma related to David?',exact:true}).click();await expect(page.getByRole('status').filter({hasText:"Emma is David's child"})).toBeVisible();await page.locator('.tree-panel svg').waitFor();await page.screenshot({path:`output/business/screenshots/${label}-06-owner-relationship.png`,fullPage:true});
 checks.push({name:`${label}: final screenshots, rendered photographs, confirmed relationship and no page overflow`,passed:true});await context.close();
}}finally{await browser.close()}
writeFileSync('output/business/visual-capture-tests.json',JSON.stringify({date:new Date().toISOString(),checks},null,2));console.log('Final desktop/mobile visuals captured.');
