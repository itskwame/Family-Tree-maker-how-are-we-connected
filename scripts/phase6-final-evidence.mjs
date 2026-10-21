import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const originalScreenshot=page.screenshot.bind(page);
page.screenshot=async options=>{await page.locator('svg [data-person]').first().waitFor();await page.getByText('Saved',{exact:true}).waitFor();await page.waitForTimeout(300);return originalScreenshot(options)};
try{
 await page.goto('http://127.0.0.1:5176/phase6.html');await page.getByLabel('Email address',{exact:true}).fill('emma@example.test');await page.getByLabel('Password',{exact:true}).fill('Fictional-Phase6-Only!42');await page.getByRole('button',{name:'Sign in & continue'}).click();await page.getByRole('heading',{name:/Emma is David/}).waitFor();
 await page.getByRole('button',{name:'Grow my family',exact:true}).click();await page.getByRole('button',{name:'My brothers or sisters'}).click();await page.getByLabel('Relationship type').selectOption('half');await page.getByLabel('First name',{exact:true}).fill('Nina');await page.getByLabel('Last name',{exact:true}).fill('Example '+Date.now().toString().slice(-5));await page.getByRole('button',{name:'Save relative',exact:true}).click();await page.getByRole('heading',{name:'You added Nina. Invite them to connect?'}).waitFor();await page.screenshot({path:'output/phase6/screenshots/03-desktop-builder.png',fullPage:true});
 await page.getByLabel('Their email address').fill('nina@example.test');await page.getByRole('button',{name:'Create private invitation link'}).click();await page.getByRole('button',{name:'Copy link',exact:true}).waitFor();await page.screenshot({path:'output/phase6/screenshots/04-voluntary-invitation.png',fullPage:true});
 // Existing templates are mounted in the isolated entry, not the hosted-connected application.
 await page.getByRole('button',{name:'My connection',exact:true}).click();await page.getByRole('link',{name:'Explore fictional demonstration templates (separate from your family)'}).click();await page.locator('[data-person]').first().waitFor({timeout:30000});assert(!errors.length,errors.join('\n'));
 writeFileSync('output/phase6/final-browser-check.json',JSON.stringify({passed:true,checks:['Pending builder preview','Voluntary link and approval notice','Existing templates load in isolated entry'],errors},null,2));
}catch(e){console.error(e);writeFileSync('output/phase6/final-browser-check.json',JSON.stringify({passed:false,error:e.message,errors},null,2));process.exitCode=1}finally{await browser.close()}
