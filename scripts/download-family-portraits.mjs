import fs from 'node:fs/promises';
const base = 'public/family-portraits';
const manifest = JSON.parse(await fs.readFile(`${base}/sources.json`, 'utf8'));
for (const item of manifest.portraits) {
  // Keep original proportions. Cropping is performed by the shared SVG renderer.
  const url = `https://images.pexels.com/photos/${item.photoId}/pexels-photo-${item.photoId}.jpeg?auto=compress&cs=tinysrgb&w=800`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${item.person}: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  await fs.writeFile(`${base}/${item.person}.jpg`, bytes);
  console.log(`${item.person}: ${bytes.length} bytes`);
}
