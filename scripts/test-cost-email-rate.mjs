import assert from 'node:assert/strict';
import {admin,client} from './phase6-local.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const email=`cost-email-${Date.now()}@example.test`;
assert.ifError((await admin.auth.admin.createUser({email,email_confirm:true})).error);
const c=client();assert.ifError((await c.auth.signInWithOtp({email})).error);
const repeat=await c.auth.signInWithOtp({email});assert.equal(repeat.error?.status,429);
mkdirSync('output/cost-controls',{recursive:true});writeFileSync('output/cost-controls/email-rate-test.json',JSON.stringify({at:new Date().toISOString(),scope:'fictional local account only',checks:[{name:'Direct Auth API resend within 60 seconds rejected independently of UI',status:429,passed:true}]},null,2));
console.log('PASS direct Auth API rejects immediate resend with HTTP 429');
