"""Verify and rasterize the actual browser-exported Phase 2 artifacts."""
import json
import re
import argparse
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image, ImageChops, ImageStat
from pypdf import PdfReader
import pypdfium2 as pdfium

parser = argparse.ArgumentParser()
parser.add_argument("--phase", choices=["phase2", "phase2b", "phase3"], default="phase2b")
phase = parser.parse_args().phase
portraits = phase != "phase2"
count = 100 if phase == "phase3" else 25
stem = f"familyconnect-{count}-portraits" if portraits else "familyconnect-25-minimalist"
out = Path("output") / phase
pdf_path = Path("output/pdf") / f"{stem}.pdf"
root = ET.parse(out / f"{stem}.svg").getroot()
people = [el for el in root.iter() if "data-person" in el.attrib]
assert len(people) == count
assert len({el.attrib["data-person"] for el in people}) == count
images = [el for el in root.iter() if el.tag.endswith("image")]
assert len(images) == (8 if portraits else 0)
assert all(el.attrib["href"].startswith("data:image/jpeg;base64,") for el in images)
reader = PdfReader(pdf_path)
assert len(reader.pages) == 1
page = reader.pages[0]
text = page.extract_text()
names = []
for person in people:
    name = next(el.text for el in person if el.tag.endswith("text") and el.attrib.get("font-size") == "14")
    assert re.search(rf"\b{re.escape(name)}\b", text), f"Missing PDF name: {name}"
    names.append(name)
viewbox = list(map(float, root.attrib["viewBox"].split()))
expected_width = viewbox[2] * 12 / 14 if phase == "phase3" else 594 * 72 / 25.4
expected_height = viewbox[3] * 12 / 14 if phase == "phase3" else 420 * 72 / 25.4
assert abs(float(page.mediabox.width) - expected_width) < .1
assert abs(float(page.mediabox.height) - expected_height) < .1
if phase == "phase3":
    assert root.attrib["width"].endswith("mm")
    assert root.attrib["height"].endswith("mm")
assert len(list(page.images)) == (8 if portraits else 0), "PDF must embed every portrait"
doc = pdfium.PdfDocument(pdf_path)
reference = Image.open(out / "08-standalone-svg.png").convert("RGB")
render = doc[0].render(scale=reference.width / float(page.mediabox.width)).to_pil().convert("RGB")
render = render.resize(reference.size, Image.Resampling.LANCZOS)
render.save(out / "06-exported-pdf.png")
diff = ImageChops.difference(reference, render)
mean = sum(ImageStat.Stat(diff).mean) / 3
# Different PDF/browser rasterizers cause antialiasing differences. A global
# threshold catches broad layout drift; manual review remains mandatory.
assert mean < 5, f"Unexpected SVG/PDF visual drift: mean channel difference {mean}"
photo_checks = {}
if portraits:
    graph = next(el for el in root.iter() if "data-print-graph" in el.attrib)
    gx, gy = map(float, re.findall(r"[-\d.]+", graph.attrib["transform"]))
    for person in people:
        image = next((el for el in person.iter() if "data-photo" in el.attrib), None)
        if image is None:
            continue
        x, y = map(float, re.findall(r"[-\d.]+", person.attrib["transform"]))
        left, top = round(gx + x + 49), round(gy + y + 13)
        box = (left, top, left + 64, top + 64)
        a, b = reference.crop(box), render.crop(box)
        delta = sum(ImageStat.Stat(ImageChops.difference(a, b)).mean) / 3
        assert delta < 15, f"Portrait mismatch: {person.attrib['data-person']} = {delta}"
        assert max(ImageStat.Stat(b).stddev) > 20, "PDF portrait appears blank"
        for image_crop in [a, b]:
            for point in [(1, 1), (62, 1), (1, 62), (62, 62)]:
                assert min(image_crop.getpixel(point)) > 240, "Photo escapes its circular clip"
        photo_checks[person.attrib["data-person"]] = {"mean_channel_difference": round(delta, 3), "circular_clip": "pass", "nonblank": True}
result = {
    "pages": 1, "paper": "Automatic roll poster" if phase == "phase3" else "A2 landscape",
    "paper_mm": [round(expected_width * 25.4 / 72, 2), round(expected_height * 25.4 / 72, 2)], "people_in_svg": len(people),
    "names_present_in_pdf": names, "external_images": 0,
    "embedded_photographs": len(images), "portrait_checks": photo_checks,
    "svg_pdf_mean_channel_difference_0_to_255": round(mean, 4),
    "raster_comparison_threshold": 5,
    "note": "Raster comparison supplements, and does not replace, visual inspection.",
}
if phase == "phase3":
    png = Image.open(out / f"{stem}.png").convert("RGB")
    result["png_dimensions"] = list(png.size)
    png_reference = png.resize(reference.size, Image.Resampling.LANCZOS)
    png_diff = sum(ImageStat.Stat(ImageChops.difference(reference, png_reference)).mean) / 3
    assert png_diff < 5
    result["png_svg_mean_channel_difference"] = round(png_diff, 4)
    # Readable inspection crops are additional evidence, not replacements for the full page.
    graph = next(el for el in root.iter() if "data-print-graph" in el.attrib)
    gx, gy = map(float, re.findall(r"[-\d.]+", graph.attrib["transform"]))
    for ident in ["emma", "b2-bb", "b1-aaa"]:
        person = next(el for el in people if el.attrib["data-person"] == ident)
        x, y = map(float, re.findall(r"[-\d.]+", person.attrib["transform"]))
        crop = (round(gx+x-60), round(gy+y-100), round(gx+x+222), round(gy+y+200))
        render.crop(crop).resize((564,600)).save(out / f"06-pdf-detail-{ident}.png")
(out / "export-results.json").write_text(json.dumps(result, indent=2), encoding="utf8")
print(json.dumps(result, indent=2))
