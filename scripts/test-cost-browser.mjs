import {chromium,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const f=JSON.parse(readFileSync('output/business/private/demo.json')),ctx=await browser.newContext({viewport:{width:390,height:844}}),page=await ctx.newPage();
 await page.goto('http://127.0.0.1:5176/phase6.html');await page.getByRole('button',{name:'Explore My Family Connection',exact:true}).click();await page.getByLabel('Email address',{exact:true}).fill(f.accounts.emma.email);await page.getByLabel('Password',{exact:true}).fill(f.accounts.emma.password);await page.getByRole('button',{name:'Sign in & continue'}).click();await page.getByRole('button',{name:'Family Businesses',exact:true}).click();await expect(page.locator('.business-card')).toHaveCount(4);
 const initial=await page.locator('.business-card img').count();assert(initial<4,'Offscreen logos should not all download immediately');
 for(let i=0;i<4;i++){const card=page.locator('.business-card').nth(i);await card.scrollIntoViewIfNeeded();await expect(card.locator('img')).toBeVisible()}
 assert.equal(await page.locator('.business-card img').count(),4);
 writeFileSync('output/cost-controls/lazy-images.json',JSON.stringify({at:new Date().toISOString(),initialLoaded:initial,afterScrollLoaded:4,passed:true},null,2));
 for(const [label,width,height] of [['desktop',1440,1000],['mobile',390,844]]){await page.setViewportSize({width,height});await page.goto(pathToFileURL(resolve('COST-CONTROL-PLAN.html')).href);await expect(page.getByRole('heading',{name:'Start free. Keep growth deliberate.'})).toBeVisible();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:`output/cost-controls/plan-${label}.png`});}
 console.log('PASS private image lazy loading and cost report desktop/mobile layout');
}finally{await browser.close()}
