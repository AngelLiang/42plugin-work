#!/usr/bin/env bun
/**
 * 生成 app icon
 * 基于项目 logo 样式：橙色渐变圆角方块 + "42" 白色文字
 * 运行：bun run scripts/generate-icon.ts
 */

import { $ } from "bun";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");
const ICONSET_DIR = join(ROOT, "icon.iconset");

// SVG 定义，使用与 CSS 相同的渐变色
const svg = (size: number) => {
  // macOS 图标规范：内容占画布 80%，四周留 10% 空白
  const pad = Math.round(size * 0.10);
  const inner = size - pad * 2;
  const radius = Math.round(inner * 0.22);
  const fontSize = Math.round(inner * 0.48);
  const cx = size / 2;
  const cy = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ea580c;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${radius}" ry="${radius}" fill="url(#grad)" />
  <text
    x="${cx}" y="${cy + Math.round(inner * 0.18)}"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
    font-size="${fontSize}"
    font-weight="700"
    fill="white"
    letter-spacing="-1"
  >42</text>
</svg>`;
};

// iconset 所需的所有尺寸
const sizes = [
  { name: "icon_16x16.png", size: 16 },
  { name: "icon_16x16@2x.png", size: 32 },
  { name: "icon_32x32.png", size: 32 },
  { name: "icon_32x32@2x.png", size: 64 },
  { name: "icon_128x128.png", size: 128 },
  { name: "icon_128x128@2x.png", size: 256 },
  { name: "icon_256x256.png", size: 256 },
  { name: "icon_256x256@2x.png", size: 512 },
  { name: "icon_512x512.png", size: 512 },
  { name: "icon_512x512@2x.png", size: 1024 },
];

// 创建 iconset 目录
if (!existsSync(ICONSET_DIR)) {
  mkdirSync(ICONSET_DIR, { recursive: true });
}

console.log("生成图标中...");

for (const { name, size } of sizes) {
  const svgPath = join(ICONSET_DIR, `_tmp_${size}.svg`);
  const pngPath = join(ICONSET_DIR, name);

  await Bun.write(svgPath, svg(size));
  await $`rsvg-convert -w ${size} -h ${size} -o ${pngPath} ${svgPath}`.quiet();
  await $`rm ${svgPath}`.quiet();

  console.log(`  ✓ ${name} (${size}x${size})`);
}

console.log(`\n图标已生成到 icon.iconset/`);
console.log("构建时 Electrobun 会自动将其转换为 .icns 格式");
