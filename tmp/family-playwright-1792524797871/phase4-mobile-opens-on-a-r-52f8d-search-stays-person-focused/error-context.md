# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase4.spec.mjs >> mobile opens on a readable branch and relative search stays person-focused
- Location: tests\family\browser\phase4.spec.mjs:129:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:5174/?family=300#/tree-prototype
Call log:
  - navigating to "http://127.0.0.1:5174/?family=300#/tree-prototype", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "This site can’t be reached" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: 127.0.0.1
      - text: refused to connect.
    - generic [ref=e10]:
      - paragraph [ref=e11]: "Try:"
      - list [ref=e12]:
        - listitem [ref=e13]: Checking the connection
        - listitem [ref=e14]:
          - link "Checking the proxy and the firewall" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "Reload" [ref=e19] [cursor=pointer]
    - button "Details" [ref=e20] [cursor=pointer]
```

# Test source

```ts
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
  111 | });
  112 | test('personalized generations and independently exported 18x24 and 24x36 posters',async({page,browser})=>{
  113 |   test.setTimeout(120000);await page.goto(url);
  114 |   await page.getByLabel('Branch root').selectOption('emma');await waitPeople(page,4);
  115 |   await page.getByLabel('Ancestor generations').selectOption('2');await waitPeople(page,11);
  116 |   await page.screenshot({path:`${out}/03-person-focused-branch.png`,fullPage:true});
  117 |   await page.getByLabel('Descendant generations').selectOption('0');await waitPeople(page,9);
  118 |   await page.getByLabel('Descendant generations').selectOption('1');await waitPeople(page,11);
  119 |   await page.getByRole('button',{name:'Print studio',exact:true}).click();
  120 |   const metrics={};
  121 |   for(const format of ['poster18','poster24']) {
  122 |     await page.getByLabel('Paper size').selectOption(format);
  123 |     await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeEnabled();
  124 |     await page.screenshot({path:`${out}/06-personalized-${format}.png`,fullPage:true});
  125 |     metrics[format]=await exportsFor(page,browser,`familyconnect-emma-${format}`,11,7);
  126 |   }
  127 |   await fs.writeFile(`${out}/personal-export-metrics.json`,JSON.stringify(metrics,null,2));
  128 | });
  129 | test('mobile opens on a readable branch and relative search stays person-focused',async({page})=>{
> 130 |   await page.setViewportSize({width:390,height:844});await page.goto(url);await waitPeople(page,4);
      |                                                                 ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:5174/?family=300#/tree-prototype
  131 |   const readable=()=>page.locator('[data-person]>rect').evaluateAll(nodes=>{
  132 |     const v=document.querySelector('[data-testid=interactive-tree]').getBoundingClientRect();
  133 |     return nodes.every(el=>{const b=el.getBoundingClientRect();return b.width>100&&b.left>=v.left&&b.right<=v.right&&b.top>=v.top&&b.bottom<=v.bottom;});
  134 |   });
  135 |   await expect.poll(readable).toBe(true);await page.screenshot({path:`${out}/04-mobile-start.png`,fullPage:true});
  136 |   await page.getByLabel('Search people').fill('Emma Bennett');await page.getByRole('button',{name:'Emma Bennett 1984'}).click();await waitPeople(page,4);
  137 |   await page.getByLabel('Focus relative',{exact:true}).selectOption('c7-22');await waitPeople(page,1);
  138 |   await page.getByLabel('Ancestor generations').selectOption('1');await waitPeople(page,3);await expect.poll(readable).toBe(true);
  139 |   await page.screenshot({path:`${out}/04-mobile-selected-relative.png`,fullPage:true});
  140 |   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  141 | });
  142 | 
  143 | 
```