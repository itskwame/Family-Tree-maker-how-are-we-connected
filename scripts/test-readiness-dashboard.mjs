import {chromium,expect} from '@playwright/test';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {estimate} from './cost-model.mjs';
assert.equal(estimate(10000).estimatedMonthlyUSD,54);assert.equal(estimate(10000).alternativeStaticHostingUSD,45);assert.equal(estimate(10000,1).estimatedMonthlyUSD,65.58);
const browser=await chromium.launch({channel:'chrome',headless:true});const checks=[];
try{const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(resolve('MONTHLY-COST-DASHBOARD.html')).href);
 await expect(page.locator('#bill-total')).toHaveText('Total: not verified');await expect(page.locator('#status-photos')).toHaveText('Unknown');await expect(page.locator('#forecast')).toContainText('$54.00');
 for(const provider of ['supabase','resend','netlify'])await page.locator('#bill-'+provider).fill('0');await expect(page.locator('#bill-total')).toHaveText('Entered total: $0.00');
 await page.locator('#actual-photos').fill('800');await expect(page.locator('#status-photos')).toHaveText('LIMIT REACHED');await page.locator('#registered').selectOption('100');await expect(page.locator('#forecast')).toContainText('$0.00');await page.locator('#save').click();await page.reload();await expect(page.locator('#actual-photos')).toHaveValue('800');
 checks.push('Unknown actuals, zero invoices, full-quota warning, forecast recalculation and local save passed');
 const download=page.waitForEvent('download');await page.locator('#export').click();assert.equal((await download).suggestedFilename(),'familyconnect-cost-review.json');checks.push('Review JSON export passed');
 // New context for deliverable screenshots: show unknown actuals, not synthetic zeros.
 const clean=await browser.newContext(),preview=await clean.newPage();
 for(const [label,width,height]of [['desktop',1440,1000],['mobile',390,844]]){await preview.setViewportSize({width,height});for(const [file,name]of [['MONTHLY-COST-DASHBOARD.html','dashboard'],['COST-READINESS-REVIEW.html','review']]){await preview.goto(pathToFileURL(resolve(file)).href);assert(await preview.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await preview.screenshot({path:`output/cost-readiness/${name}-${label}.png`})}}
 assert.deepEqual(errors,[]);checks.push('Desktop/mobile layouts without overflow or runtime errors');writeFileSync('output/cost-readiness/dashboard-tests.json',JSON.stringify({at:new Date().toISOString(),checks,passed:true},null,2));console.log('PASS cost model, dashboard interactions, export and layouts');
}finally{await browser.close()}
