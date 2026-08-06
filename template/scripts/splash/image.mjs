import { existsSync } from "node:fs";

import sharp from "sharp";

import { fromRoot } from "./paths.mjs";
import { escapeXml } from "./utils.mjs";

/** Во сколько раз мастер-изображение крупнее @1x — запас на все плотности. */
export const MASTER_SCALE = 4;

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

export const canvas = (width, height) =>
  sharp({ create: { width, height, channels: 4, background: TRANSPARENT } });

export const measure = buffer => sharp(buffer).metadata();

/** Уменьшает мастер до нужной ширины в пикселях. */
export const fitToWidth = (artwork, width) =>
  sharp(artwork.buffer).resize({ width, fit: "inside" }).png().toBuffer();

export const renderFile = path => {
  const file = fromRoot(path);

  if (!existsSync(file)) {
    throw new Error(`Не найден файл источника: ${path}`);
  }

  // density влияет только на растеризацию SVG, для PNG игнорируется.
  return sharp(file, { density: 72 * MASTER_SCALE })
    .png()
    .toBuffer();
};

export const renderText = ({ text, font, size, color }) => {
  const markup = color
    ? `<span foreground="${color}">${escapeXml(text)}</span>`
    : escapeXml(text);

  return sharp({
    text: {
      text: markup,
      font: `${font} ${size}`,
      rgba: true,
      dpi: 72 * MASTER_SCALE,
    },
  })
    .png()
    .toBuffer();
};
