// Generates BrokeBro PWA icons from an inline SVG brand mark.
// Run: node scripts/make-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "..", "public", "icons");
mkdirSync(out, { recursive: true });

// App icon: rounded ink tile + lime gradient "B". Maskable gets extra padding.
const glyph = (size, pad) => {
  const s = size - pad * 2;
  const r = size * 0.24;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#0B0F0C"/>
  <rect x="${(size - s * 0.52) / 2}" y="${(size - s * 0.62) / 2}" width="${s * 0.52}" height="${s * 0.62}" rx="${s * 0.14}"
    fill="none" stroke="url(#g)" stroke-width="${Math.max(6, size * 0.028)}"/>
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#bef264"/><stop offset="1" stop-color="#34d399"/>
  </linearGradient></defs>
  <text x="50%" y="52%" dominant-baseline="central" text-anchor="middle"
    font-family="Arial, sans-serif" font-weight="900" font-size="${s * 0.4}" fill="#bef264">B</text>
</svg>`;
};

const jobs = [
  ["icon-192.png", 192, 0],
  ["icon-512.png", 512, 0],
  ["maskable-512.png", 512, 110], // safe-zone padding for maskable
  ["apple-touch-icon.png", 180, 0],
];

for (const [name, size, pad] of jobs) {
  await sharp(Buffer.from(glyph(size, pad))).png().toFile(path.join(out, name));
  console.log("wrote", name);
}
