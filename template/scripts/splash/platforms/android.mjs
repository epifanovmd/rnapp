import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { fitToWidth } from "../artwork.mjs";
import { canvas } from "../image.mjs";
import { fromRoot } from "../paths.mjs";
import { log, px } from "../utils.mjs";

/** Плотности Android и множители размера. */
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

const drawableDir = (resPath, density, night) =>
  join(resPath, night ? `drawable-night-${density}` : `drawable-${density}`);

const writeImages = async ({ resPath, artwork, name, night }) => {
  for (const [density, scale] of Object.entries(DENSITIES)) {
    const dir = drawableDir(resPath, density, night);

    await mkdir(dir, { recursive: true });

    const content = await fitToWidth(artwork, px(artwork.widthDp, scale));

    await canvas(px(artwork.slot.width, scale), px(artwork.slot.height, scale))
      .composite([{ input: content, gravity: "centre" }])
      .png()
      .toFile(join(dir, `${name}.png`));
  }
};

/** Точечно обновляет цвет в colors.xml, не трогая остальные значения. */
const writeColor = async (file, value, name) => {
  await mkdir(dirname(file), { recursive: true });

  const entry = `    <color name="${name}">${value}</color>`;
  const existing = existsSync(file) ? await readFile(file, "utf8") : null;

  if (!existing) {
    await writeFile(file, `<resources>\n${entry}\n</resources>\n`);

    return;
  }

  const pattern = new RegExp(`[ \\t]*<color name="${name}">[^<]*</color>`);
  const next = pattern.test(existing)
    ? existing.replace(pattern, entry)
    : existing.replace("</resources>", `${entry}\n</resources>`);

  await writeFile(file, next);
};

/** Ночные ресурсы прошлых прогонов, если тёмной темы в конфиге больше нет. */
const removeNightResources = async (resPath, names) => {
  for (const density of Object.keys(DENSITIES)) {
    const dir = drawableDir(resPath, density, true);

    for (const name of [names.logo, names.brand]) {
      await rm(join(dir, `${name}.png`), { force: true });
    }

    if (existsSync(dir) && (await readdir(dir)).length === 0) {
      await rm(dir, { recursive: true, force: true });
    }
  }

  const colors = join(resPath, "values-night", "colors.xml");

  if (!existsSync(colors)) {
    return;
  }

  const content = await readFile(colors, "utf8");
  const stripped = content.replace(
    new RegExp(`[ \\t]*<color name="${names.background}">[^<]*</color>\\n?`),
    "",
  );

  if (/<color/.test(stripped)) {
    await writeFile(colors, stripped);
  } else {
    await rm(dirname(colors), { recursive: true, force: true });
  }
};

export const generateAndroid = async (config, artworks) => {
  const resPath = fromRoot(config.android.resPath);
  const { names } = config.android;

  if (!artworks.dark) {
    await removeNightResources(resPath, names);
  }

  for (const [theme, artwork] of Object.entries(artworks)) {
    if (!artwork) {
      continue;
    }

    const night = theme === "dark";

    if (artwork.logo) {
      await writeImages({
        resPath,
        artwork: artwork.logo,
        name: names.logo,
        night,
      });
    }

    if (artwork.brand) {
      await writeImages({
        resPath,
        artwork: artwork.brand,
        name: names.brand,
        night,
      });
    }
  }

  await writeColor(
    join(resPath, "values", "colors.xml"),
    config.light.background,
    names.background,
  );

  if (config.dark?.background) {
    await writeColor(
      join(resPath, "values-night", "colors.xml"),
      config.dark.background,
      names.background,
    );
  }

  log("🤖  Android: drawable-*, values/colors.xml");
};
