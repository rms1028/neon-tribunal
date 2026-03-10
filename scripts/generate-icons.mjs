import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SVG_PATH = join(ROOT, "public", "favicon.svg");
const OUT_DIR = join(ROOT, "public", "icons");

mkdirSync(OUT_DIR, { recursive: true });

const svgBuffer = readFileSync(SVG_PATH);
const BG_COLOR = { r: 5, g: 5, b: 14, alpha: 1 }; // #05050e

async function generateStandard(size) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(OUT_DIR, `icon-${size}.png`));
  console.log(`Generated icon-${size}.png`);
}

async function generateMaskable(size) {
  const innerSize = Math.round(size * 0.7);
  const padding = Math.round((size - innerSize) / 2);

  const iconResized = await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: BG_COLOR },
  })
    .composite([{ input: iconResized, top: padding, left: padding }])
    .png()
    .toFile(join(OUT_DIR, `icon-maskable-${size}.png`));
  console.log(`Generated icon-maskable-${size}.png`);
}

async function generateAppleTouchIcon() {
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(OUT_DIR, "apple-touch-icon.png"));
  console.log("Generated apple-touch-icon.png");
}

await Promise.all([
  generateStandard(192),
  generateStandard(512),
  generateMaskable(192),
  generateMaskable(512),
  generateAppleTouchIcon(),
]);
console.log("All icons generated!");
