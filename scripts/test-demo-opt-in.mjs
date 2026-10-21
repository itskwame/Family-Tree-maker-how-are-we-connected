import {chromium,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[];
try{const context=await browser.newContext(),page=await context.newPage(),requests=[];page.on('request',r=>requests.push({url:r.url(),method:r.method()}));
 await page.goto('http://127.0.0.1:5176/phase6.html');await expect(page.getByRole('button',{name:'Explore My Family Connection',exact:true})).toBeVisible();assert(!requests.some(r=>/fixture(?:100|300)?\.js|FamilyPrototype/.test(r.url)));checks.push({name:'Normal local onboarding does not load the fictional tree modules',passed:true});
 await page.goto('http://127.0.0.1:5176/phase6.html?view=templates&template=botanical');await expect(page.getByRole('status').filter({hasText:'Fictional demonstration only.'})).toBeVisible();await expect(page.locator('.fc-paper svg [data-person]')).toHaveCount(11,{timeout:30000});await expect(page.getByRole('heading',{name:'The Bennett & Reed family',exact:true})).toBeVisible();checks.push({name:'Explicit local demo route is labeled separate and preserves the 11-person premium example',passed:true});
 await page.screenshot({path:'output/demo-audit/screenshots/local-opt-in-demonstration.png',fullPage:true});await page.getByRole('link',{name:'Leave demonstration and return to my family',exact:true}).click();await expect(page.getByRole('button',{name:'Explore My Family Connection',exact:true})).toBeVisible();assert(!requests.some(r=>r.method==='POST'&&/\/rest\/v1\/rpc\/fc_action/.test(r.url)));checks.push({name:'Leaving the demonstration returns to onboarding; viewing samples creates no family records',passed:true});
}finally{await browser.close()}
writeFileSync('output/demo-audit/demo-opt-in-tests.json',JSON.stringify({date:new Date().toISOString(),checks},null,2));console.log(`${checks.length} opt-in demonstration checks passed.`);
