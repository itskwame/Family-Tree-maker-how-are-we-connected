import { FORMATS } from './Scene.jsx';

export async function prepareExport(element) {
  if (element.dataset.template && element.dataset.readable !== 'true') throw new Error('Choose a larger print format or a smaller family branch.');
  const clone = element.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.querySelectorAll('[tabindex]').forEach(node => node.removeAttribute('tabindex'));
  const sources = new Map();
  await Promise.all([...clone.querySelectorAll('image')].map(async image => {
    const href = image.getAttribute('href');
    if (!href) throw new Error('A portrait has no source.');
    if (!sources.has(href)) sources.set(href, (async () => {
    const response = await fetch(href);
    if (!response.ok) throw new Error(`Could not embed portrait ${image.dataset.photo}. Please reload before exporting.`);
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) throw new Error('Portrait source is not an image.');
    const embedded = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const decoded = new Image();
    decoded.src = embedded;
    await decoded.decode();
    return embedded;
    })());
    image.setAttribute('href', await sources.get(href));
  }));
  return clone;
}
export async function svgSource(element) {
  const clone = await prepareExport(element);
  if (['roll', 'poster18', 'poster24'].includes(element.dataset.format)) {
    const paper = exportPaper(element, element.dataset.format);
    clone.setAttribute('width', `${paper.width}mm`);
    clone.setAttribute('height', `${paper.height}mm`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
}
export function exportPaper(element, format) {
  if (element.dataset.paperWidth) return { width: Number(element.dataset.paperWidth), height: Number(element.dataset.paperHeight) };
  const box = element.viewBox.baseVal;
  return format === 'roll' ? { width: box.width * 12 / 14 * 25.4 / 72, height: box.height * 12 / 14 * 25.4 / 72 } : FORMATS[format];
}
const filename = element => element.dataset.template ? `familyconnect-botanical-${element.dataset.count}-${element.dataset.format}` : element.dataset.subject ? `familyconnect-${element.dataset.subject}-${element.dataset.format}` : `familyconnect-${element.dataset.count || 25}-portraits`;
function download(blob, name) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export async function exportSVG(element) {
  download(new Blob([await svgSource(element)], { type: 'image/svg+xml;charset=utf-8' }), `${filename(element)}.svg`);
}
export async function exportPDF(element, format) {
  const [{ jsPDF }] = await Promise.all([import('jspdf'), import('svg2pdf.js')]);
  const artwork = await prepareExport(element), paper = exportPaper(element, format);
  // PDF UserUnit preserves physical size beyond the default 200-inch limit.
  const userUnit = Math.max(1, Math.ceil(Math.max(paper.width, paper.height) / 5000));
  const pageWidth = paper.width / userUnit, pageHeight = paper.height / userUnit;
  const doc = new jsPDF({ orientation: pageWidth > pageHeight ? 'landscape' : 'portrait', unit: 'mm', format: [pageWidth, pageHeight], userUnit, compress: true });
  if (userUnit > 1) doc.__private__.setPdfVersion('1.6');
  const box = element.viewBox.baseVal;
  const scale = Math.min(pageWidth / box.width, pageHeight / box.height);
  const width = box.width * scale, height = box.height * scale;
  await doc.svg(artwork, { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height });
  doc.setProperties({ title: element.dataset.template ? 'Our family - Botanical heirloom' : 'Our family', author: 'FamilyConnect', subject: `${element.dataset.count} family members; automatic layout` });
  doc.save(`${filename(element)}.pdf`);
}
export async function exportPNG(element, format) {
  const artwork = await prepareExport(element), box = element.viewBox.baseVal;
  const paper = exportPaper(element, format);
  // 100 pixels per print inch: a review raster. PDF/SVG remain the print masters.
  const premium = !!element.dataset.template, dpi = premium ? 300 : 100;
  const scale = Math.min(Math.min(paper.width / box.width, paper.height / box.height) * dpi / 25.4, 16384 / box.width, 16384 / box.height, Math.sqrt((premium ? 96000000 : 24000000) / (box.width * box.height)));
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(box.width * scale); canvas.height = Math.ceil(box.height * scale);
  artwork.setAttribute('width', canvas.width); artwork.setAttribute('height', canvas.height);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(artwork)], { type: 'image/svg+xml' }));
  try {
    const image = new Image(); image.src = url; await image.decode();
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Unable to create PNG.');
    download(premium ? await pngResolution(blob, dpi) : blob, `${filename(element)}.png`);
  } finally { URL.revokeObjectURL(url); canvas.width = canvas.height = 0; }
}

// PNG pHYs chunk: physical pixels/metre, with the standard IEEE CRC-32.
// Canvas otherwise reports 96 dpi even when artwork was rendered at 300 ppi.
async function pngResolution(blob, dpi) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const chunk = new Uint8Array(21), view = new DataView(chunk.buffer);
  view.setUint32(0, 9); chunk.set([112,72,89,115], 4);
  view.setUint32(8, Math.round(dpi / .0254)); view.setUint32(12, Math.round(dpi / .0254)); chunk[16] = 1;
  let crc = 0xffffffff;
  for (const value of chunk.slice(4,17)) { crc ^= value; for(let bit=0;bit<8;bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  view.setUint32(17, (crc ^ 0xffffffff) >>> 0);
  const parts = [bytes.slice(0,33), chunk];
  for (let i=33;i<bytes.length;) {
    const length = new DataView(bytes.buffer, bytes.byteOffset+i,4).getUint32(0) + 12;
    if (String.fromCharCode(...bytes.slice(i+4,i+8)) !== 'pHYs') parts.push(bytes.slice(i,i+length));
    i += length;
  }
  return new Blob(parts, { type: 'image/png' });
}
