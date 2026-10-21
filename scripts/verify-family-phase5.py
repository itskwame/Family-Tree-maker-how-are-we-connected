"""Independent PDFium rendering and portrait/text/physical-size export checks."""
import json, re
import xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image, ImageChops, ImageStat
from pypdf import PdfReader
import pypdfium2 as pdfium

out = Path('output/phase5')
results = {}
def difference(a,b): return sum(ImageStat.Stat(ImageChops.difference(a,b)).mean)/3
for count in [11,15,25,40]:
    info = json.loads((out/f'browser-{count}.json').read_text())
    stem = info['stem']
    root = ET.parse(out/f'{stem}.svg').getroot()
    people = [el for el in root.iter() if 'data-person' in el.attrib]
    assert len(people) == len({p.attrib['data-person'] for p in people}) == count
    photos = [el for el in root.iter() if 'data-photo' in el.attrib]
    assert len(photos) == info['scene']['photos']
    assert all(el.attrib['href'].startswith('data:image/jpeg;base64,') and el.attrib['preserveAspectRatio']=='xMidYMin slice' for el in photos)
    paper = info['formats'][info['format']]['paper']
    assert abs(float(root.attrib['width'].removesuffix('mm'))-paper[0]) < .01
    assert abs(float(root.attrib['height'].removesuffix('mm'))-paper[1]) < .01
    pdf = Path('output/pdf')/f'{stem}.pdf'
    reader = PdfReader(pdf); assert len(reader.pages)==1
    page = reader.pages[0]
    assert abs(float(page.mediabox.width)*25.4/72-paper[0])<.01
    assert abs(float(page.mediabox.height)*25.4/72-paper[1])<.01
    text=page.extract_text()
    for p in people:
        name=[el.text for el in p.iter() if el.attrib.get('data-name') in ['first','last']]
        assert len(re.findall(r'\b'+r'\s+'.join(map(re.escape,name))+r'\b',text))==1, name
    assert len(list(page.images))==len(photos)
    ref=Image.open(out/f'{count}-offline-svg.png').convert('RGB')
    doc=pdfium.PdfDocument(pdf)
    render=doc[0].render(scale=ref.width/doc[0].get_width()).to_pil().convert('RGB').resize(ref.size,Image.Resampling.LANCZOS)
    render.save(out/f'{count}-pdf-render.png')
    delta=difference(ref,render); assert delta<5, (count,delta)
    png=Image.open(out/f'{stem}.png')
    assert all(abs(d-300)<.02 for d in png.info['dpi'])
    assert abs(png.width-paper[0]/25.4*300)<2 and abs(png.height-paper[1]/25.4*300)<2
    png_delta=difference(ref,png.convert('RGB').resize(ref.size,Image.Resampling.LANCZOS));assert png_delta<5
    graph=next(el for el in root.iter() if 'data-print-graph' in el.attrib)
    gx,gy,s=map(float,re.findall(r'[-\d.]+',graph.attrib['transform']))
    portraits={}
    for p in people:
        if not any('data-photo' in el.attrib for el in p.iter()):continue
        x,y=map(float,re.findall(r'[-\d.]+',p.attrib['transform']))
        box=tuple(round(v) for v in [gx+(x+28)*s,gy+(y+10)*s,gx+(x+148)*s,gy+(y+142)*s])
        a,b=ref.crop(box),render.crop(box)
        d=difference(a,b); assert d<25,(count,p.attrib['data-person'],d)
        assert max(ImageStat.Stat(b).stddev)>15
        for image in [a,b]:
            for point in [(2,2),(image.width-3,2)]:
                assert max(abs(v-e) for v,e in zip(image.getpixel(point),(248,245,237)))<15, 'Photo outside arch'
        portraits[p.attrib['data-person']]=round(d,3)
    # Render actual PDF vector artwork at sufficient resolution for close review.
    emma=next(p for p in people if p.attrib['data-person']=='emma')
    x,y=map(float,re.findall(r'[-\d.]+',emma.attrib['transform']))
    left,top=gx+(x-4)*s,gy+(y-8)*s
    right,bottom=gx+(x+180)*s,gy+(y+212)*s
    vw,vh=map(float,root.attrib['viewBox'].split()[2:])
    unit=doc[0].get_width()/vw
    crop=(left*unit,(vh-bottom)*unit,(vw-right)*unit,top*unit)
    doc[0].render(scale=3/(unit*s),crop=crop).to_pil().save(out/f'{count}-pdf-portrait-detail.png')
    results[count]={'people':count,'photos':len(photos),'paper_mm':paper,'first_names_pt':float(root.attrib['data-name-pt']),
        'dates_pt':float(root.attrib['data-name-pt'])*.55,'pdf_svg_mean_rgb_difference':delta,'png_svg_mean_rgb_difference':png_delta,
        'png_pixels':list(png.size),'png_dpi':list(png.info['dpi']),'portrait_differences':portraits,'pdf_names':'all exactly once','arch_clipping':'pass'}
    doc.close()
alternate = Path('tmp/phase5/alternate-11-poster24.pdf')
reader = PdfReader(alternate)
assert len(reader.pages)==1
assert abs(float(reader.pages[0].mediabox.width)*25.4/72-609.6)<.01
assert abs(float(reader.pages[0].mediabox.height)*25.4/72-914.4)<.01
assert len(list(reader.pages[0].images))==7
doc=pdfium.PdfDocument(alternate)
doc[0].render(scale=1000/doc[0].get_width()).to_pil().save('tmp/phase5/alternate-11-poster24-render.png')
doc.close()
(out/'export-results.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
