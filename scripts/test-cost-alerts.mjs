import assert from 'node:assert/strict';
import {evaluateUsage} from './cost-check.mjs';
const policy={maxSnapshotAgeHours:48,warningFraction:.7,criticalFraction:.9,limits:{bytes:100}},now=Date.now();
for(const [value,status] of [[0,'OK'],[70,'WARNING'],[90,'CRITICAL'],[100,'LIMIT'],[undefined,'UNKNOWN'],[-1,'UNKNOWN']])assert.equal(evaluateUsage(policy,{checkedAt:new Date(now).toISOString(),usage:{bytes:value}},now)[0].status,status);
assert.equal(evaluateUsage(policy,{checkedAt:new Date(now-49*3600000).toISOString(),usage:{bytes:0}},now)[0].status,'STALE');
console.log('PASS usage thresholds, unknown metrics and stale snapshots');
