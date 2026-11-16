import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out='output/hosted-beta/final',hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const rehearsal=JSON.parse(readFileSync(`${out}/rehearsal-results.json`));
assert.equal(rehearsal.candidates.length,20);
for(const c of rehearsal.candidates)assert.equal(hash(c.file),c.sha256,'SQL drift since rehearsal: '+c.file);
const extra=[
 `${out}/reviewed-transaction.sql`,`${out}/rehearsal-results.json`,`${out}/rehearsal-catalog.json`,
 `${out}/critical-security-results.json`,`${out}/onboarding-browser-results.json`,`${out}/independent-recovery-results.json`,`${out}/restored-table-security-results.json`,
 'scripts/hosted-migration-sql.mjs','scripts/rehearse-beta-final.mjs','scripts/beta-final-local.mjs','scripts/test-beta-critical.mjs','scripts/test-beta-onboarding-browser.mjs','scripts/rehearse-beta-recovery.mjs','scripts/verify-beta-restored-acls.mjs',
 'src/phase6/BetaOnboarding.jsx','src/phase6/main.jsx','src/phase6/Social.jsx',
 'HOSTED-CRITICAL-BETA-REVIEW.md','HOSTED-RECOVERY-RUNBOOK.md'
];
const files=[...rehearsal.candidates.map(c=>c.file),...extra].map(file=>({file,sha256:hash(file)}));
const manifest={preparedAt:new Date().toISOString(),target:'jmsntxwkaneluqgnzzim',status:'REVIEW ONLY — hosted recovery/access and explicit approval required',migrationCount:20,hostedChanges:false,containsSeeds:false,files};
writeFileSync(`${out}/review-manifest.json`,JSON.stringify(manifest,null,2));
writeFileSync(`${out}/SHA256SUMS.txt`,files.map(f=>`${f.sha256}  ${f.file}`).join('\n')+'\n');
console.log(`Prepared ${files.length} exact file hashes; SQL matches the 20-file rehearsal.`);
