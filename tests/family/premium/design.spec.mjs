import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { edgePath } from '../../../src/family/geometry.js';

for (const count of [11,15,25,40]) test(`Botanical heirloom: ${count} people, responsive composition and independent exports`, async ({page,browser}) => {
  const out='output/phase5', errors=[];
  await fs.mkdir(out,{recursive:true}); page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?family=300&template=botanical#/tree-prototype');
  await page.getByLabel('Premium family').selectOption(String(count));
  const svg=page.getByTestId('print-svg');
  await expect(svg.locator('[data-person]')).toHaveCount(count, {timeout:30000});
  const formats={};
  for (const format of ['poster18','poster24']) {
    await page.getByLabel('Paper size').selectOption(format);
    formats[format]=await svg.evaluate(el=>({readable:el.dataset.readable==='true',namePt:Number(el.dataset.namePt),paper:[Number(el.dataset.paperWidth),Number(el.dataset.paperHeight)]}));
    if(!formats[format].readable) {
      await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeDisabled();
      await expect(page.getByRole('button',{name:'Download SVG',exact:true})).toBeDisabled();
      await expect(page.getByRole('button',{name:'Download PNG',exact:true})).toBeDisabled();
    }
  }
  const format=formats.poster18.readable ? 'poster18' : 'poster24';
  await page.getByLabel('Paper size').selectOption(format);
  const stem=`familyconnect-botanical-${count}-${format}`;
  await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeEnabled();
  const scene=await svg.evaluate(async el=>{
    const cards=[...el.querySelectorAll('[data-person]')];
    const photos=[...el.querySelectorAll('[data-photo]')];
    await Promise.all(photos.map(async photo=>{const image=new Image();image.src=photo.getAttribute('href');await image.decode();}));
    const bounds=cards.map(card=>{const box=card.getBoundingClientRect();return {id:card.dataset.person,x:box.x,y:box.y,w:box.width,h:box.height};});
    const overlap=[]; for(let i=0;i<bounds.length;i++) for(let j=i+1;j<bounds.length;j++) {const a=bounds[i],b=bounds[j];if(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)overlap.push([a.id,b.id]);}
    return { ids:cards.map(c=>c.dataset.person), photos:photos.length, overlap, width:el.viewBox.baseVal.width,height:el.viewBox.baseVal.height, textOverflow:cards.filter(card=>[...card.querySelectorAll('text')].some(t=>{const b=t.getBBox();return !t.closest('[data-portrait]')&&(b.x<0||b.x+b.width>176);})).map(c=>c.dataset.person) };
  });
  expect(scene.overlap).toEqual([]);expect(scene.textOverflow).toEqual([]);expect(new Set(scene.ids).size).toBe(count);
  const expectedLayout=JSON.parse(await fs.readFile(`${out}/layout-${count}.json`,'utf8')).layout;
  const actualEdges=await svg.locator('[data-edge]').evaluateAll(els=>Object.fromEntries(els.map(el=>[el.dataset.edge,el.getAttribute('d')])));
  expect(actualEdges).toEqual(Object.fromEntries(expectedLayout.edges.map(e=>[e.id,edgePath(e)])));
  await page.screenshot({path:`${out}/${count}-studio.png`,fullPage:true});
  await svg.screenshot({path:`${out}/${count}-preview.png`});
  for(const type of ['SVG','PDF','PNG']) {
    const download=page.waitForEvent('download');await page.getByRole('button',{name:`Download ${type}`,exact:true}).click();
    await (await download).saveAs(type==='PDF'?`output/pdf/${stem}.pdf`:`${out}/${stem}.${type.toLowerCase()}`);
  }
  const source=await fs.readFile(`${out}/${stem}.svg`,'utf8');
  expect((source.match(/href="data:image\/jpeg;base64,/g)||[]).length).toBe(scene.photos);
  const offline=await browser.newContext({offline:true,viewport:{width:1200,height:Math.round(scene.height)}});
  const standalone=await offline.newPage();await standalone.goto(pathToFileURL(resolve(`${out}/${stem}.svg`)).href);
  await standalone.locator('svg').evaluate(el=>{el.setAttribute('width',1200);el.setAttribute('height',el.viewBox.baseVal.height);});
  await expect(standalone.locator('[data-person]')).toHaveCount(count);
  await standalone.screenshot({path:`${out}/${count}-offline-svg.png`});await offline.close();
  await fs.writeFile(`${out}/browser-${count}.json`,JSON.stringify({stem,format,formats,scene,errors},null,2));
  if(count===11) {
    await page.getByLabel('Paper size').selectOption('poster24');
    await fs.mkdir('tmp/phase5',{recursive:true});
    for(const type of ['SVG','PDF']) {
      const download=page.waitForEvent('download');await page.getByRole('button',{name:`Download ${type}`,exact:true}).click();
      await (await download).saveAs(`tmp/phase5/alternate-11-poster24.${type.toLowerCase()}`);
    }
  }
  expect(errors).toEqual([]);
});

test('premium failed portrait falls back and template switching preserves interactive relationships',async({page})=>{
  await page.route('**/family-portraits/emma.jpg',route=>route.abort());
  await page.goto('/?family=25&template=botanical#/tree-prototype');
  const svg=page.getByTestId('print-svg');await expect(svg.locator('[data-person]')).toHaveCount(11);
  await expect(svg.locator('[data-photo=emma]')).toHaveCount(0);
  await expect(svg.locator('[data-initials=emma]')).toHaveText('EB');
  await page.getByLabel('Template',{exact:true}).selectOption('minimalist');
  await expect(svg).toHaveAttribute('aria-label','Minimalist printable family tree');
  await expect(svg.locator('[data-person]')).toHaveCount(25);
  await page.getByRole('button',{name:'Explore family',exact:true}).click();
  await page.getByLabel('First person',{exact:true}).selectOption('emma');
  await page.getByLabel('Second person',{exact:true}).selectOption('leo');
  await page.getByRole('button',{name:'Show connection',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Half-siblings',exact:true})).toBeVisible();
});
