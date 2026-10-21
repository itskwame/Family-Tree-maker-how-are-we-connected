# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase4.spec.mjs >> obsolete layout is terminated and only the latest selected branch is displayed
- Location: tests\family\browser\phase4.spec.mjs:99:1

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('[data-person]')
Expected: 4
Received: 0
Timeout:  30000ms

Call log:
  - Expect "toHaveCount" with timeout 30000ms
  - waiting for locator('[data-person]')
    62 × locator resolved to 0 elements
       - unexpected value "0"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "F FamilyConnect" [ref=e5] [cursor=pointer]:
      - /url: "#/"
      - generic [ref=e6]: F
      - text: FamilyConnect
    - generic [ref=e7]: FICTIONAL FAMILY · PHASE 4
    - link "Back to home ↗" [ref=e8] [cursor=pointer]:
      - /url: "#/"
  - main [ref=e9]:
    - generic [ref=e10]:
      - generic [ref=e11]:
        - paragraph [ref=e12]: EVERY CONNECTION HAS A STORY
        - heading "The Bennett & Reed family" [level=1] [ref=e13]
        - paragraph [ref=e14]: Six generations. Many branches. One connected family.
      - generic [ref=e15]:
        - strong [ref=e16]:
          - text: "300"
          - generic [ref=e17]: people
        - strong [ref=e18]:
          - text: "6"
          - generic [ref=e19]: generations
        - strong [ref=e20]:
          - text: "104"
          - generic [ref=e21]: partnerships
    - generic [ref=e22]:
      - generic "Tree view" [ref=e23]:
        - button "Explore family" [ref=e24] [cursor=pointer]
        - button "Print studio" [ref=e25] [cursor=pointer]
      - textbox "Search people" [ref=e27]:
        - /placeholder: Search 300 family members…
    - region "Family view controls" [ref=e28]:
      - generic [ref=e29]:
        - text: Family view
        - combobox "Branch root" [ref=e30]:
          - option "Complete family · 300 people"
          - option "Aaron Turner's branch"
          - option "Ada Brooks's branch"
          - option "Adam Morgan's branch"
          - option "Adrian Abbott's branch"
          - option "Adrian Foster's branch"
          - option "Adrian Palmer's branch"
          - option "Adrian Porter's branch"
          - option "Adrian Spencer's branch"
          - option "Adrian Sutton's branch"
          - option "Adrian Walsh's branch"
          - option "Agnes Bennett's branch"
          - option "Alex Cole's branch"
          - option "Alfie Turner's branch"
          - option "Alice Morgan's branch"
          - option "Amelia Turner's branch"
          - option "Anya Brooks's branch"
          - option "Arlo Brooks's branch"
          - option "Arthur Bennett's branch"
          - option "Ava Hart's branch"
          - option "Avery Abbott's branch"
          - option "Avery Foster's branch"
          - option "Avery Palmer's branch"
          - option "Avery Porter's branch"
          - option "Avery Spencer's branch"
          - option "Avery Sutton's branch"
          - option "Avery Walsh's branch"
          - option "Bailey Abbott's branch"
          - option "Bailey Foster's branch"
          - option "Bailey Palmer's branch"
          - option "Bailey Porter's branch"
          - option "Bailey Spencer's branch"
          - option "Bailey Sutton's branch"
          - option "Bailey Walsh's branch"
          - option "Beatrice Stone's branch"
          - option "Ben Ellis's branch"
          - option "Blair Abbott's branch"
          - option "Blair Foster's branch"
          - option "Blair Palmer's branch"
          - option "Blair Porter's branch"
          - option "Blair Spencer's branch"
          - option "Blair Sutton's branch"
          - option "Blair Walsh's branch"
          - option "Cameron Abbott's branch"
          - option "Cameron Foster's branch"
          - option "Cameron Palmer's branch"
          - option "Cameron Porter's branch"
          - option "Cameron Spencer's branch"
          - option "Cameron Sutton's branch"
          - option "Cameron Walsh's branch"
          - option "Casey Abbott's branch"
          - option "Casey Foster's branch"
          - option "Casey Palmer's branch"
          - option "Casey Porter's branch"
          - option "Casey Spencer's branch"
          - option "Casey Sutton's branch"
          - option "Casey Walsh's branch"
          - option "Celia Hayes's branch"
          - option "Claire Abbott's branch"
          - option "Claire Foster's branch"
          - option "Claire Palmer's branch"
          - option "Claire Porter's branch"
          - option "Claire Spencer's branch"
          - option "Claire Sutton's branch"
          - option "Claire Walsh's branch"
          - option "Clara Reed's branch"
          - option "Cora Brooks's branch"
          - option "Daisy Cole's branch"
          - option "Daniel Abbott's branch"
          - option "Daniel Foster's branch"
          - option "Daniel Palmer's branch"
          - option "Daniel Porter's branch"
          - option "Daniel Spencer's branch"
          - option "Daniel Sutton's branch"
          - option "Daniel Walsh's branch"
          - option "David Bennett's branch"
          - option "Dylan Hayes's branch"
          - option "Eden Cole's branch"
          - option "Edith Hayes's branch"
          - option "Edmund Bennett's branch"
          - option "Edward Brooks's branch"
          - option "Eleanor Bennett's branch"
          - option "Elise Turner's branch"
          - option "Eliza Brooks's branch"
          - option "Ella Morgan's branch"
          - option "Ellis Abbott's branch"
          - option "Ellis Foster's branch"
          - option "Ellis Palmer's branch"
          - option "Ellis Porter's branch"
          - option "Ellis Spencer's branch"
          - option "Ellis Sutton's branch"
          - option "Ellis Walsh's branch"
          - option "Elsie Hayes's branch"
          - option "Emma Bennett's branch" [selected]
          - option "Eric Brooks's branch"
          - option "Esme Cole's branch"
          - option "Ethan Ellis's branch"
          - option "Evan Hayes's branch"
          - option "Evie Morgan's branch"
          - option "Faye Turner's branch"
          - option "Felix Cole's branch"
          - option "Finn Morgan's branch"
          - option "Frank Turner's branch"
          - option "Freya Cole's branch"
          - option "George Cole's branch"
          - option "Grace Shaw's branch"
          - option "Harvey Turner's branch"
          - option "Hazel Morgan's branch"
          - option "Helen Bennett's branch"
          - option "Henry Cole's branch"
          - option "Holly Hayes's branch"
          - option "Hugo Brooks's branch"
          - option "Iris Reed's branch"
          - option "Isaac Cole's branch"
          - option "Isla Morgan's branch"
          - option "Ivy Morgan's branch"
          - option "Jack Bennett's branch"
          - option "Jamie Abbott's branch"
          - option "Jamie Foster's branch"
          - option "Jamie Palmer's branch"
          - option "Jamie Porter's branch"
          - option "Jamie Spencer's branch"
          - option "Jamie Sutton's branch"
          - option "Jamie Walsh's branch"
          - option "Joel Brooks's branch"
          - option "Jordan Abbott's branch"
          - option "Jordan Foster's branch"
          - option "Jordan Palmer's branch"
          - option "Jordan Porter's branch"
          - option "Jordan Spencer's branch"
          - option "Jordan Sutton's branch"
          - option "Jordan Walsh's branch"
          - option "Jude Morgan's branch"
          - option "Julian Abbott's branch"
          - option "Julian Foster's branch"
          - option "Julian Palmer's branch"
          - option "Julian Porter's branch"
          - option "Julian Spencer's branch"
          - option "Julian Sutton's branch"
          - option "Julian Walsh's branch"
          - option "June Turner's branch"
          - option "Lara Brooks's branch"
          - option "Leah Abbott's branch"
          - option "Leah Foster's branch"
          - option "Leah Palmer's branch"
          - option "Leah Porter's branch"
          - option "Leah Spencer's branch"
          - option "Leah Sutton's branch"
          - option "Leah Walsh's branch"
          - option "Lena Brooks's branch"
          - option "Leo Bennett's branch"
          - option "Leon Brooks's branch"
          - option "Liam Turner's branch"
          - option "Lily Morgan's branch"
          - option "Logan Abbott's branch"
          - option "Logan Foster's branch"
          - option "Logan Palmer's branch"
          - option "Logan Porter's branch"
          - option "Logan Spencer's branch"
          - option "Logan Sutton's branch"
          - option "Logan Walsh's branch"
          - option "Louis Cole's branch"
          - option "Luca Hayes's branch"
          - option "Lucas Hart's branch"
          - option "Lucy Cole's branch"
          - option "Mabel Cole's branch"
          - option "Marion Abbott's branch"
          - option "Marion Foster's branch"
          - option "Marion Palmer's branch"
          - option "Marion Porter's branch"
          - option "Marion Spencer's branch"
          - option "Marion Sutton's branch"
          - option "Marion Walsh's branch"
          - option "Martha Abbott's branch"
          - option "Martha Foster's branch"
          - option "Martha Palmer's branch"
          - option "Martha Porter's branch"
          - option "Martha Spencer's branch"
          - option "Martha Sutton's branch"
          - option "Martha Walsh's branch"
          - option "Max Morgan's branch"
          - option "Maya Brooks's branch"
          - option "Mia Bennett's branch"
          - option "Miles Hayes's branch"
          - option "Millie Turner's branch"
          - option "Milo Morgan's branch"
          - option "Morgan Abbott's branch"
          - option "Morgan Foster's branch"
          - option "Morgan Palmer's branch"
          - option "Morgan Porter's branch"
          - option "Morgan Spencer's branch"
          - option "Morgan Sutton's branch"
          - option "Morgan Walsh's branch"
          - option "Naomi Hayes's branch"
          - option "Nell Turner's branch"
          - option "Nina Cole's branch"
          - option "Noah Bennett's branch"
          - option "Nora Wells's branch"
          - option "Olive Hayes's branch"
          - option "Olivia Bennett's branch"
          - option "Oscar Morgan's branch"
          - option "Oscar Turner's branch"
          - option "Otis Cole's branch"
          - option "Owen Morgan's branch"
          - option "Parker Abbott's branch"
          - option "Parker Foster's branch"
          - option "Parker Palmer's branch"
          - option "Parker Porter's branch"
          - option "Parker Spencer's branch"
          - option "Parker Sutton's branch"
          - option "Parker Walsh's branch"
          - option "Pearl Hayes's branch"
          - option "Peter Ellis's branch"
          - option "Poppy Turner's branch"
          - option "Quinn Abbott's branch"
          - option "Quinn Foster's branch"
          - option "Quinn Palmer's branch"
          - option "Quinn Porter's branch"
          - option "Quinn Spencer's branch"
          - option "Quinn Sutton's branch"
          - option "Quinn Walsh's branch"
          - option "Reese Abbott's branch"
          - option "Reese Foster's branch"
          - option "Reese Palmer's branch"
          - option "Reese Porter's branch"
          - option "Reese Spencer's branch"
          - option "Reese Sutton's branch"
          - option "Reese Walsh's branch"
          - option "Riley Abbott's branch"
          - option "Riley Foster's branch"
          - option "Riley Palmer's branch"
          - option "Riley Porter's branch"
          - option "Riley Spencer's branch"
          - option "Riley Sutton's branch"
          - option "Riley Walsh's branch"
          - option "Robin Abbott's branch"
          - option "Robin Foster's branch"
          - option "Robin Palmer's branch"
          - option "Robin Porter's branch"
          - option "Robin Spencer's branch"
          - option "Robin Sutton's branch"
          - option "Robin Walsh's branch"
          - option "Rory Brooks's branch"
          - option "Rose Cole's branch"
          - option "Rowan Abbott's branch"
          - option "Rowan Foster's branch"
          - option "Rowan Palmer's branch"
          - option "Rowan Porter's branch"
          - option "Rowan Spencer's branch"
          - option "Rowan Sutton's branch"
          - option "Rowan Walsh's branch"
          - option "Ruby Morgan's branch"
          - option "Ruth Lane's branch"
          - option "Ryan Hayes's branch"
          - option "Sage Abbott's branch"
          - option "Sage Foster's branch"
          - option "Sage Palmer's branch"
          - option "Sage Porter's branch"
          - option "Sage Spencer's branch"
          - option "Sage Sutton's branch"
          - option "Sage Walsh's branch"
          - option "Samuel Reed's branch"
          - option "Sean Turner's branch"
          - option "Simon Abbott's branch"
          - option "Simon Foster's branch"
          - option "Simon Palmer's branch"
          - option "Simon Porter's branch"
          - option "Simon Spencer's branch"
          - option "Simon Sutton's branch"
          - option "Simon Walsh's branch"
          - option "Skyler Abbott's branch"
          - option "Skyler Foster's branch"
          - option "Skyler Palmer's branch"
          - option "Skyler Porter's branch"
          - option "Skyler Spencer's branch"
          - option "Skyler Sutton's branch"
          - option "Skyler Walsh's branch"
          - option "Sophie Ellis's branch"
          - option "Sylvia Abbott's branch"
          - option "Sylvia Foster's branch"
          - option "Sylvia Palmer's branch"
          - option "Sylvia Porter's branch"
          - option "Sylvia Spencer's branch"
          - option "Sylvia Sutton's branch"
          - option "Sylvia Walsh's branch"
          - option "Taylor Abbott's branch"
          - option "Taylor Foster's branch"
          - option "Taylor Palmer's branch"
          - option "Taylor Porter's branch"
          - option "Taylor Spencer's branch"
          - option "Taylor Sutton's branch"
          - option "Taylor Walsh's branch"
          - option "Tessa Turner's branch"
          - option "Theo Hart's branch"
          - option "Thomas Bennett's branch"
          - option "Toby Hayes's branch"
          - option "Vera Brooks's branch"
          - option "Victor Hayes's branch"
          - option "Walter Stone's branch"
          - option "Willa Hayes's branch"
          - option "Zoe Ellis's branch"
      - generic [ref=e31]:
        - text: Show
        - combobox "Branch direction" [ref=e32]:
          - option "Personalized generations" [selected]
          - option "Descendants + partners"
          - option "Ancestors + partners"
      - button "Expand complete family" [ref=e33] [cursor=pointer]
      - generic [ref=e34]:
        - text: Ancestor generations
        - combobox "Ancestor generations" [ref=e35]:
          - option "0" [selected]
          - option "1"
          - option "2"
          - option "3"
          - option "4"
          - option "5"
          - option "6"
      - generic [ref=e36]:
        - text: Descendant generations
        - combobox "Descendant generations" [ref=e37]:
          - option "0"
          - option "1" [selected]
          - option "2"
          - option "3"
          - option "4"
          - option "5"
          - option "6"
      - generic [ref=e38]:
        - generic [ref=e39]: Parentage / partnership
        - generic [ref=e41]: Former partnership
        - generic [ref=e43]: Adoptive parentage
        - generic [ref=e45]: ○ Family junction · Gap = crossing
    - alert [ref=e46]: "Uncaught TypeError: _Worker is not a constructor"
    - status [ref=e47]: Unable to lay out this family.
    - generic [ref=e48]:
      - generic [ref=e49]:
        - text: Stock models portray fictional characters; names, dates and relationships are invented. Some stock models are reused in this stress fixture.
        - link "Photo credits" [ref=e50] [cursor=pointer]:
          - /url: /family-portraits/sources.json
      - generic [ref=e51]: Automatic graph layout · No manually placed people
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import fs from 'node:fs/promises';
  3   | import { resolve } from 'node:path';
  4   | import { pathToFileURL } from 'node:url';
  5   | const out='output/phase4', url='/?family=300#/tree-prototype';
  6   | test.beforeEach(async({page})=>{
  7   |   await fs.mkdir(out,{recursive:true});
  8   |   await page.route(/fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr/,route=>route.abort());
  9   | });
> 10  | async function waitPeople(page,count) { await expect(page.locator('[data-person]')).toHaveCount(count,{timeout:30000}); await expect.poll(()=>page.evaluate(()=>window.__familyMetrics?.people),{timeout:30000}).toBe(count); }
      |                                                                                     ^ Error: expect(locator).toHaveCount(expected) failed
  11  | async function checkPhotos(page,count) {
  12  |   const photos=await page.locator('[data-photo]').evaluateAll(async elements=>Promise.all(elements.map(async el=>{
  13  |     const im=new Image();im.src=el.getAttribute('href');await im.decode();
  14  |     const clip=document.getElementById(el.getAttribute('clip-path').slice(5,-1))?.querySelector('circle');
  15  |     return im.naturalWidth>=600 && el.getAttribute('preserveAspectRatio')==='xMidYMin slice' && clip?.getAttribute('r')==='32';
  16  |   })));
  17  |   expect(photos).toHaveLength(count);expect(photos.every(Boolean)).toBe(true);
  18  | }
  19  | async function exportsFor(page,browser,stem,count,photoCount) {
  20  |   const metrics={};
  21  |   for(const type of ['SVG','PDF','PNG']) {
  22  |     const started=performance.now(),download=page.waitForEvent('download');
  23  |     await page.getByRole('button',{name:`Download ${type}`,exact:true}).click();
  24  |     const file=await download, path=type==='PDF'?`output/pdf/${stem}.pdf`:`${out}/${stem}.${type.toLowerCase()}`;
  25  |     await file.saveAs(path); metrics[type]={wallMs:performance.now()-started,bytes:(await fs.stat(path)).size};
  26  |   }
  27  |   const svg=await fs.readFile(`${out}/${stem}.svg`,'utf8');
  28  |   expect((svg.match(/href="data:image\/jpeg;base64,/g)||[]).length).toBe(photoCount);
  29  |   expect(svg).not.toContain('href="/family-portraits/');
  30  |   const dimensions=await page.getByTestId('print-svg').evaluate(el=>{
  31  |     const vb=el.viewBox.baseVal,scale=Math.min(1,14000/vb.width);
  32  |     return {width:Math.ceil(vb.width*scale),height:Math.ceil(vb.height*scale)};
  33  |   });
  34  |   const offline=await browser.newContext({offline:true,viewport:dimensions}),standalone=await offline.newPage();
  35  |   await standalone.goto(pathToFileURL(resolve(`${out}/${stem}.svg`)).href);
  36  |   await expect(standalone.locator('[data-person]')).toHaveCount(count);
  37  |   await checkPhotos(standalone,photoCount);
  38  |   await standalone.locator('svg').evaluate((el,d)=>{el.setAttribute('width',d.width);el.setAttribute('height',d.height);},dimensions);
  39  |   await standalone.screenshot({path:`${out}/${stem}-offline-svg.png`});await offline.close();
  40  |   return metrics;
  41  | }
  42  | test('300 desktop, worker responsiveness, distant path, navigation and complete exports',async({page,browser})=>{
  43  |   test.setTimeout(180000);
  44  |   const errors=[];page.on('pageerror',e=>errors.push(e.message));
  45  |   await page.addInitScript(()=>{
  46  |     window.__tasks=[];window.__beats=[];let last=performance.now();
  47  |     setInterval(()=>{const now=performance.now();window.__beats.push({at:now,interval:now-last});last=now;},50);
  48  |     new PerformanceObserver(list=>window.__tasks.push(...list.getEntries().map(e=>({at:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});
  49  |   });
  50  |   const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
  51  |   const start=performance.now();await page.goto(url);await waitPeople(page,300);
  52  |   const navigationReadyWallMs=performance.now()-start;
  53  |   const initial=await page.evaluate(()=>({metrics:window.__familyMetrics,tasks:window.__tasks,beats:window.__beats,workers:window.__layoutWorkerStats}));
  54  |   await checkPhotos(page,36);
  55  |   expect(await page.locator('[data-person]').evaluateAll(nodes=>new Set(nodes.map(n=>n.dataset.person)).size)).toBe(300);
  56  |   expect(await page.locator('[data-person]').evaluateAll(nodes=>nodes.filter(n=>!n.querySelector('[data-photo]')).length)).toBe(264);
  57  |   await expect(page.locator('[data-crossover]')).toHaveCount(226);
  58  |   expect(await page.locator('[data-person]>rect').evaluateAll(nodes=>{
  59  |     const v=document.querySelector('[data-testid=interactive-tree]').getBoundingClientRect();
  60  |     return nodes.every(n=>{const b=n.getBoundingClientRect();return b.left>=v.left&&b.right<=v.right&&b.top>=v.top&&b.bottom<=v.bottom;});
  61  |   })).toBe(true);
  62  |   await page.screenshot({path:`${out}/01-complete-desktop.png`,fullPage:true});
  63  |   const heapBefore=await cdp.send('Performance.getMetrics');
  64  |   const normalStart=await page.evaluate(()=>performance.now());
  65  |   await page.getByLabel('First person',{exact:true}).selectOption('b1-aaa');
  66  |   await page.getByLabel('Second person',{exact:true}).selectOption('c7-22');
  67  |   const connectionStart=performance.now();await page.getByRole('button',{name:'Show connection',exact:true}).click();
  68  |   await expect(page.getByRole('heading',{name:'Third cousins, once removed',exact:true})).toBeVisible();
  69  |   const connectionMs=performance.now()-connectionStart;
  70  |   await expect(page.getByLabel('Evidence path').locator('option')).toHaveCount(2);
  71  |   await page.getByLabel('Evidence path').selectOption('1');await page.getByLabel('Evidence path').selectOption('0');
  72  |   expect(await page.locator('[data-highlighted]').count()).toBeGreaterThan(10);
  73  |   await page.getByRole('button',{name:'Fit connection',exact:true}).click();
  74  |   await page.screenshot({path:`${out}/02-distant-relationship.png`,fullPage:true});
  75  |   await page.getByLabel('Search people').fill('Emma Bennett');
  76  |   await page.getByRole('button',{name:'Emma Bennett 1984'}).click();
  77  |   await expect.poll(()=>page.locator('[data-person=emma]>rect').evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThan(140);
  78  |   await page.evaluate(()=>{window.__frames=[];window.__sample=true;let last;function f(now){if(last)window.__frames.push(now-last);last=now;if(window.__sample)requestAnimationFrame(f);}requestAnimationFrame(f);});
  79  |   const canvas=page.getByTestId('interactive-tree'),box=await canvas.boundingBox(),group=canvas.locator(':scope>g');
  80  |   const beforePan=await group.getAttribute('transform');
  81  |   await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  82  |   await page.mouse.move(box.x+box.width/2+100,box.y+box.height/2+30,{steps:20});await page.mouse.up();
  83  |   expect(await group.getAttribute('transform')).not.toBe(beforePan);
  84  |   for(let i=0;i<20;i++)await page.mouse.wheel(0,i<10?-40:40);
  85  |   const frames=await page.evaluate(()=>{window.__sample=false;return window.__frames;});
  86  |   const normalEnd=await page.evaluate(()=>performance.now());
  87  |   const normalTasks=await page.evaluate(([a,b])=>window.__tasks.filter(t=>t.at>=a&&t.at<b),[normalStart,normalEnd]);
  88  |   expect(Math.max(0,...normalTasks.map(t=>t.duration))).toBeLessThan(500);
  89  |   expect(frames.sort((a,b)=>a-b)[Math.floor(frames.length*.95)]).toBeLessThan(100);
  90  |   await page.getByRole('button',{name:'Print studio',exact:true}).click();
  91  |   await expect(page.getByTestId('print-svg').locator('[data-person]')).toHaveCount(300);
  92  |   await page.screenshot({path:`${out}/05-complete-print-preview.png`,fullPage:true});
  93  |   const exports=await exportsFor(page,browser,'familyconnect-300-portraits',300,36);
  94  |   const heapAfter=await cdp.send('Performance.getMetrics');
  95  |   await page.getByLabel('Paper size').selectOption('poster24');await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeDisabled();
  96  |   await fs.writeFile(`${out}/browser-metrics.json`,JSON.stringify({browser:browser.version(),navigationReadyWallMs,initial,connectionMs,normalTasks,frameIntervalsMs:frames,exports,heapBefore:heapBefore.metrics,heapAfter:heapAfter.metrics,allTasks:await page.evaluate(()=>window.__tasks),workers:await page.evaluate(()=>window.__layoutWorkerStats)},null,2));
  97  |   expect(errors).toEqual([]);
  98  | });
  99  | test('obsolete layout is terminated and only the latest selected branch is displayed',async({page})=>{
  100 |   await page.goto(url);
  101 |   await expect.poll(()=>page.evaluate(()=>window.__layoutWorkerStats?.started||0)).toBeGreaterThan(0);
  102 |   const before=await page.evaluate(()=>window.__layoutWorkerStats.cancelled);
  103 |   await page.getByLabel('Branch root').selectOption('emma');await waitPeople(page,4);
  104 |   expect(await page.evaluate(()=>window.__layoutWorkerStats.cancelled)).toBeGreaterThan(before);
  105 |   await page.getByRole('button',{name:'Expand complete family',exact:true}).click();
  106 |   await expect(page.getByRole('status')).toBeVisible();
  107 |   await page.getByLabel('Branch root').selectOption('c1-3');await waitPeople(page,5);
  108 |   await expect(page.locator('[data-person=c1-3]')).toHaveCount(1);
  109 |   expect(page.workers()).toHaveLength(0);
  110 |   await fs.writeFile(`${out}/cancellation-results.json`,JSON.stringify(await page.evaluate(()=>window.__layoutWorkerStats),null,2));
```