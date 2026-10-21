"""Inspect and independently render browser-generated Phase 4 exports."""
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from PIL import Image, ImageChops, ImageStat
from pypdf import PdfReader
import pypdfium2 as pdfium

out = Path('output/phase4')
results = {}
for stem, count, photo_count, paper in [
    ('familyconnect-300-portraits', 300, 36, None),
    ('familyconnect-emma-poster18', 11, 7, (457.2, 609.6)),
    ('familyconnect-emma-poster24', 11, 7, (609.6, 914.4)),
]:
    root = ET.parse(out / f'{stem}.svg').getroot()
    people = [el for el in root.iter() if 'data-person' in el.attrib]
    assert len(people) == len({el.attrib['data-person'] for el in people}) == count
    photos = [el for el in root.iter() if 'data-photo' in el.attrib]
    assert len(photos) == photo_count
    assert all(el.attrib['href'].startswith('data:image/jpeg;base64,') for el in photos)
    vb = list(map(float, root.attrib['viewBox'].split()))
    physical = (vb[2] * 12 / 14 * 25.4 / 72, vb[3] * 12 / 14 * 25.4 / 72) if paper is None else paper
    assert abs(float(root.attrib['width'].removesuffix('mm')) - physical[0]) < .01
    assert abs(float(root.attrib['height'].removesuffix('mm')) - physical[1]) < .01
    reader = PdfReader(Path('output/pdf') / f'{stem}.pdf')
    assert len(reader.pages) == 1
    page = reader.pages[0]
    user_unit = float(page.get('/UserUnit', 1))
    pdf_width, pdf_height = float(page.mediabox.width), float(page.mediabox.height)
    assert abs(pdf_width * user_unit * 25.4 / 72 - physical[0]) < .01
    assert abs(pdf_height * user_unit * 25.4 / 72 - physical[1]) < .01
    text = page.extract_text()
    for person in people:
        full_name = []
        for size in ['14', '12']:
            name = next(el.text for el in person if el.tag.endswith('text') and el.attrib.get('font-size') == size)
            assert re.search(rf'\b{re.escape(name)}\b', text), f'Missing name: {name}'
            full_name.append(re.escape(name))
        occurrences = len(re.findall(r'\b' + r'\s+'.join(full_name) + r'\b', text))
        expected = 2 if person.attrib['data-person'] == root.attrib.get('data-subject') else 1
        assert occurrences == expected, f'Unexpected PDF name count: {full_name}, {occurrences}'
    assert len(list(page.images)) == (8 if count == 300 else 7)
    doc = pdfium.PdfDocument(Path('output/pdf') / f'{stem}.pdf')
    reference = Image.open(out / f'{stem}-offline-svg.png').convert('RGB')
    # PDFium reports page dimensions in its own page units. Physical dimensions
    # are independently checked above, including PDF 1.6 UserUnit scaling.
    render = doc[0].render(scale=reference.width / doc[0].get_width()).to_pil().convert('RGB')
    render = render.resize(reference.size, Image.Resampling.LANCZOS)
    render.save(out / f'{stem}-pdf-render.png')
    mean = sum(ImageStat.Stat(ImageChops.difference(reference, render)).mean) / 3
    assert mean < 5, f'PDF/SVG mismatch: {mean}'
    png = Image.open(out / f'{stem}.png').convert('RGB')
    assert png.width <= 16384 and png.height <= 16384 and png.width * png.height < 24050000
    png_diff = sum(ImageStat.Stat(ImageChops.difference(reference, png.resize(reference.size, Image.Resampling.LANCZOS))).mean) / 3
    assert png_diff < 5
    graph = next(el for el in root.iter() if 'data-print-graph' in el.attrib)
    gx, gy = map(float, re.findall(r'[-\d.]+', graph.attrib['transform']))
    sx, sy = reference.width / vb[2], reference.height / vb[3]
    portrait_checks = {}
    for person in people:
        if not any('data-photo' in el.attrib for el in person.iter()):
            continue
        x, y = map(float, re.findall(r'[-\d.]+', person.attrib['transform']))
        box = (round((gx+x+49)*sx), round((gy+y+13)*sy), round((gx+x+113)*sx), round((gy+y+77)*sy))
        a, b = reference.crop(box), render.crop(box)
        delta = sum(ImageStat.Stat(ImageChops.difference(a,b)).mean)/3
        assert delta < 22, f'Portrait mismatch: {person.attrib["data-person"]}'
        assert max(ImageStat.Stat(b).stddev) > 15
        for im in [a,b]:
            for point in [(1,1),(im.width-2,1),(1,im.height-2),(im.width-2,im.height-2)]:
                fill = next(el.attrib['fill'] for el in person if el.tag.endswith('rect'))
                expected = tuple(int(fill[i:i+2],16) for i in (1,3,5))
                assert max(abs(a-b) for a,b in zip(im.getpixel(point),expected)) < 15, f'Portrait escaped circular clip: {person.attrib["data-person"]}'
        portrait_checks[person.attrib['data-person']] = round(delta,3)
    # Independently rasterized readable detail of actual PDF vector artwork.
    for ident in (['emma','c5-17'] if count == 300 else ['emma']):
        person = next(p for p in people if p.attrib['data-person']==ident)
        x,y = map(float,re.findall(r'[-\d.]+',person.attrib['transform']))
        left,top,right,bottom = gx+x-20,gy+y-60,gx+x+182,gy+y+184
        unit_scale = doc[0].get_width()/vb[2]
        crop = (left*unit_scale,(vb[3]-bottom)*unit_scale,(vb[2]-right)*unit_scale,top*unit_scale)
        detail = doc[0].render(scale=3/unit_scale,crop=crop).to_pil()
        detail.save(out / f'{stem}-detail-{ident}.png')
    results[stem] = {'people':count,'pdf_full_name_occurrences':'one per card; selected person also named in personal-poster heading','portrait_instances':photo_count,'unique_embedded_pdf_photos':len(list(page.images)),
        'paper_mm':list(physical),'user_unit':user_unit,'first_names_pt':14*physical[0]/vb[2]*72/25.4,
        'surnames_pt':12*physical[0]/vb[2]*72/25.4,'pdf_svg_mean_rgb_difference':mean,
        'png_svg_mean_rgb_difference':png_diff,'png_dimensions':list(png.size),'portrait_differences':portrait_checks}
    doc.close()
(out/'export-results.json').write_text(json.dumps(results,indent=2),encoding='utf8')
print(json.dumps({key:{k:v for k,v in value.items() if k!='portrait_differences'} for key,value in results.items()},indent=2))
