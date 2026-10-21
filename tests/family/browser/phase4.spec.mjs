import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { workerHeaps } from './worker-memory.mjs';
const out='output/phase4', url='/?family=300#/tree-prototype';
test.beforeEach(async({page})=>{
  await fs.mkdir(out,{recursive:true});
  await page.route(/fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr/,route=>route.abort());
});
async function waitPeople(page,count) { await expect(page.locator('[data-person]')).toHaveCount(count,{timeout:30000}); await expect.poll(()=>page.evaluate(()=>window.__familyMetrics?.people),{timeout:30000}).toBe(count); }
async function checkPhotos(page,count) {
  const photos=await page.locator('[data-photo]').evaluateAll(async elements=>Promise.all(elements.map(async el=>{
    const im=new Image();im.src=el.getAttribute('href');await im.decode();
    const clip=document.getElementById(el.getAttribute('clip-path').slice(5,-1))?.querySelector('circle');
    return im.naturalWidth>=600 && el.getAttribute('preserveAspectRatio')==='xMidYMin slice' && clip?.getAttribute('r')==='32';
  })));
  expect(photos).toHaveLength(count);expect(photos.every(Boolean)).toBe(true);
}
async function exportsFor(page,browser,stem,count,photoCount) {
  const metrics={};
  for(const type of ['SVG','PDF','PNG']) {
    const started=performance.now(),download=page.waitForEvent('download');
    await page.getByRole('button',{name:`Download ${type}`,exact:true}).click();
    const file=await download, path=type==='PDF'?`output/pdf/${stem}.pdf`:`${out}/${stem}.${type.toLowerCase()}`;
    await file.saveAs(path); metrics[type]={wallMs:performance.now()-started,bytes:(await fs.stat(path)).size};
  }
  const svg=await fs.readFile(`${out}/${stem}.svg`,'utf8');
  expect((svg.match(/href="data:image\/jpeg;base64,/g)||[]).length).toBe(photoCount);
  expect(svg).not.toContain('href="/family-portraits/');
  const dimensions=await page.getByTestId('print-svg').evaluate(el=>{
    const vb=el.viewBox.baseVal,scale=Math.min(1,14000/vb.width);
    return {width:Math.ceil(vb.width*scale),height:Math.ceil(vb.height*scale)};
  });
  const offline=await browser.newContext({offline:true,viewport:dimensions}),standalone=await offline.newPage();
  await standalone.goto(pathToFileURL(resolve(`${out}/${stem}.svg`)).href);
  await expect(standalone.locator('[data-person]')).toHaveCount(count);
  await checkPhotos(standalone,photoCount);
  await standalone.locator('svg').evaluate((el,d)=>{el.setAttribute('width',d.width);el.setAttribute('height',d.height);},dimensions);
  await standalone.screenshot({path:`${out}/${stem}-offline-svg.png`});await offline.close();
  return metrics;
}
test('300 desktop, worker responsiveness, distant path, navigation and complete exports',async({page,browser})=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    window.__tasks=[];window.__beats=[];let last=performance.now();
    setInterval(()=>{const now=performance.now();window.__beats.push({at:now,interval:now-last});last=now;},50);
    new PerformanceObserver(list=>window.__tasks.push(...list.getEntries().map(e=>({at:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});
  });
  const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
  const start=performance.now();await page.goto(url);
  await expect.poll(()=>page.evaluate(()=>window.__layoutWorkerStats?.started||0)).toBeGreaterThan(0);
  const workerMemory=[];
  for (let n=0;n<3;n++) { await page.waitForTimeout(500); workerMemory.push({elapsedMs:performance.now()-start,heaps:await workerHeaps(browser)}); }
  await waitPeople(page,300);
  const navigationReadyWallMs=performance.now()-start;
  const initial=await page.evaluate(()=>({metrics:window.__familyMetrics,tasks:window.__tasks,beats:window.__beats,workers:window.__layoutWorkerStats,events:window.__layoutEvents}));
  const completed=initial.events.find(e=>e.type==='completed'&&e.people===300);
  const begun=initial.events.filter(e=>e.type==='started'&&e.at<completed.at).at(-1);
  const duringLayout=initial.beats.filter(b=>b.at>begun.at+100&&b.at<completed.at);
  expect(duringLayout.length).toBeGreaterThan(5);
  expect(Math.max(...duringLayout.map(b=>b.interval))).toBeLessThan(250);
  await checkPhotos(page,36);
  expect(await page.locator('[data-person]').evaluateAll(nodes=>new Set(nodes.map(n=>n.dataset.person)).size)).toBe(300);
  expect(await page.locator('[data-person]').evaluateAll(nodes=>nodes.filter(n=>!n.querySelector('[data-photo]')).length)).toBe(264);
  await expect(page.locator('[data-crossover]')).toHaveCount(226);
  expect(await page.locator('[data-person]>rect').evaluateAll(nodes=>{
    const v=document.querySelector('[data-testid=interactive-tree]').getBoundingClientRect();
    return nodes.every(n=>{const b=n.getBoundingClientRect();return b.left>=v.left&&b.right<=v.right&&b.top>=v.top&&b.bottom<=v.bottom;});
  })).toBe(true);
  await page.screenshot({path:`${out}/01-complete-desktop.png`,fullPage:true});
  const heapBefore=await cdp.send('Performance.getMetrics');
  const normalStart=await page.evaluate(()=>performance.now());
  await page.getByLabel('First person',{exact:true}).selectOption('b1-aaa');
  await page.getByLabel('Second person',{exact:true}).selectOption('c7-22');
  const connectionStart=performance.now();await page.getByRole('button',{name:'Show connection',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Third cousins, once removed',exact:true})).toBeVisible();
  const connectionMs=performance.now()-connectionStart;
  await expect(page.getByLabel('Evidence path').locator('option')).toHaveCount(2);
  await page.getByLabel('Evidence path').selectOption('1');await page.getByLabel('Evidence path').selectOption('0');
  expect(await page.locator('[data-highlighted]').count()).toBeGreaterThan(10);
  await page.getByRole('button',{name:'Fit connection',exact:true}).click();
  await page.screenshot({path:`${out}/02-distant-relationship.png`,fullPage:true});
  await page.getByLabel('Search people').fill('Emma Bennett');
  await page.getByRole('button',{name:'Emma Bennett 1984'}).click();
  await expect.poll(()=>page.locator('[data-person=emma]>rect').evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThan(140);
  await page.evaluate(()=>{window.__frames=[];window.__sample=true;let last;function f(now){if(last)window.__frames.push(now-last);last=now;if(window.__sample)requestAnimationFrame(f);}requestAnimationFrame(f);});
  const canvas=page.getByTestId('interactive-tree'),box=await canvas.boundingBox(),group=canvas.locator(':scope>g');
  const beforePan=await group.getAttribute('transform');
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  await page.mouse.move(box.x+box.width/2+100,box.y+box.height/2+30,{steps:20});await page.mouse.up();
  expect(await group.getAttribute('transform')).not.toBe(beforePan);
  for(let i=0;i<20;i++)await page.mouse.wheel(0,i<10?-40:40);
  const frames=await page.evaluate(()=>{window.__sample=false;return window.__frames;});
  const normalEnd=await page.evaluate(()=>performance.now());
  const normalTasks=await page.evaluate(([a,b])=>window.__tasks.filter(t=>t.at>=a&&t.at<b),[normalStart,normalEnd]);
  expect(Math.max(0,...normalTasks.map(t=>t.duration))).toBeLessThan(500);
  expect(frames.sort((a,b)=>a-b)[Math.floor(frames.length*.95)]).toBeLessThan(100);
  await page.getByRole('button',{name:'Print studio',exact:true}).click();
  await expect(page.getByTestId('print-svg').locator('[data-person]')).toHaveCount(300);
  await page.screenshot({path:`${out}/05-complete-print-preview.png`,fullPage:true});
  const exports=await exportsFor(page,browser,'familyconnect-300-portraits',300,36);
  const heapAfter=await cdp.send('Performance.getMetrics');
  await page.getByLabel('Paper size').selectOption('poster24');await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeDisabled();
  await fs.writeFile(`${out}/browser-metrics.json`,JSON.stringify({browser:browser.version(),navigationReadyWallMs,initial,workerMemory,layoutHeartbeatMaxMs:Math.max(...duringLayout.map(b=>b.interval)),connectionMs,normalTasks,frameIntervalsMs:frames,exports,heapBefore:heapBefore.metrics,heapAfter:heapAfter.metrics,allTasks:await page.evaluate(()=>window.__tasks),workers:await page.evaluate(()=>window.__layoutWorkerStats)},null,2));
  expect(errors).toEqual([]);
});
test('obsolete layout is terminated and only the latest selected branch is displayed',async({page,browser})=>{
  await page.goto(url);
  await expect.poll(()=>page.evaluate(()=>window.__layoutWorkerStats?.started||0)).toBeGreaterThan(0);
  const before=await page.evaluate(()=>window.__layoutWorkerStats.cancelled);
  await page.getByLabel('Branch root').selectOption('emma');await waitPeople(page,4);
  expect(await page.evaluate(()=>window.__layoutWorkerStats.cancelled)).toBeGreaterThan(before);
  await page.getByRole('button',{name:'Expand complete family',exact:true}).click();
  await expect(page.getByRole('status')).toBeVisible();
  await page.getByLabel('Branch root').selectOption('c1-3');await waitPeople(page,6);
  await expect(page.locator('[data-person=c1-3]')).toHaveCount(1);
  expect(page.workers()).toHaveLength(0);
  expect(await workerHeaps(browser)).toHaveLength(0);
  await fs.writeFile(`${out}/cancellation-results.json`,JSON.stringify(await page.evaluate(()=>window.__layoutWorkerStats),null,2));
});
test('personalized generations and independently exported 18x24 and 24x36 posters',async({page,browser})=>{
  test.setTimeout(120000);await page.goto(url);
  await page.getByLabel('Branch root').selectOption('emma');await waitPeople(page,4);
  await page.getByLabel('Ancestor generations').selectOption('2');await waitPeople(page,11);
  await page.screenshot({path:`${out}/03-person-focused-branch.png`,fullPage:true});
  await page.getByLabel('Descendant generations').selectOption('0');await waitPeople(page,9);
  await page.getByLabel('Descendant generations').selectOption('1');await waitPeople(page,11);
  await page.getByRole('button',{name:'Print studio',exact:true}).click();
  await page.getByLabel('Paper size').selectOption('poster18');
  await page.getByLabel('Ancestor generations').selectOption('3');await waitPeople(page,15);
  expect(await page.getByTestId('print-svg').evaluate(el=>el.viewBox.baseVal.width/el.viewBox.baseVal.height)).toBeCloseTo(18/24,5);
  await page.getByLabel('Ancestor generations').selectOption('2');await waitPeople(page,11);
  const metrics={};
  for(const format of ['poster18','poster24']) {
    await page.getByLabel('Paper size').selectOption(format);
    await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeEnabled();
    await page.screenshot({path:`${out}/06-personalized-${format}.png`,fullPage:true});
    metrics[format]=await exportsFor(page,browser,`familyconnect-emma-${format}`,11,7);
  }
  await fs.writeFile(`${out}/personal-export-metrics.json`,JSON.stringify(metrics,null,2));
});
test('mobile opens on a readable branch and relative search stays person-focused',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto(url);await waitPeople(page,4);
  const readable=()=>page.locator('[data-person]>rect').evaluateAll(nodes=>{
    const v=document.querySelector('[data-testid=interactive-tree]').getBoundingClientRect();
    return nodes.every(el=>{const b=el.getBoundingClientRect();return b.width>100&&b.left>=v.left&&b.right<=v.right&&b.top>=v.top&&b.bottom<=v.bottom;});
  });
  await expect.poll(readable).toBe(true);await page.screenshot({path:`${out}/04-mobile-start.png`,fullPage:true});
  await page.getByLabel('Search people').fill('Emma Bennett');await page.getByRole('button',{name:'Emma Bennett 1984'}).click();await waitPeople(page,4);
  await page.getByLabel('Focus relative',{exact:true}).selectOption('c7-22');await waitPeople(page,1);
  await page.getByLabel('Ancestor generations').selectOption('1');await waitPeople(page,3);await expect.poll(readable).toBe(true);
  await page.screenshot({path:`${out}/04-mobile-selected-relative.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

