import { existsSync } from "node:fs";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { fitToWidth } from "../artwork.mjs";
import { fromRoot } from "../paths.mjs";
import { hexToRgb, log, px } from "../utils.mjs";
import { buildStoryboard } from "./ios-storyboard.mjs";

/** Масштабы ассетов iOS. */
const SCALES = [1, 2, 3];

const DARK_APPEARANCE = [{ appearance: "luminosity", value: "dark" }];

const contents = payload =>
  `${JSON.stringify({ ...payload, info: { author: "xcode", version: 1 } }, null, 2)}\n`;

const writeImageSet = async ({ dir, name, light, dark }) => {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  const images = [];

  for (const scale of SCALES) {
    const suffix = scale === 1 ? "" : `@${scale}x`;
    const file = `${name}${suffix}.png`;

    await writeFile(
      join(dir, file),
      await fitToWidth(light, px(light.widthDp, scale)),
    );
    images.push({ idiom: "universal", filename: file, scale: `${scale}x` });

    if (!dark) {
      continue;
    }

    const darkFile = `${name}-dark${suffix}.png`;

    await writeFile(
      join(dir, darkFile),
      await fitToWidth(dark, px(dark.widthDp, scale)),
    );
    images.push({
      idiom: "universal",
      appearances: DARK_APPEARANCE,
      filename: darkFile,
      scale: `${scale}x`,
    });
  }

  await writeFile(join(dir, "Contents.json"), contents({ images }));
};

const colorEntry = (hex, dark) => {
  const { r, g, b } = hexToRgb(hex);

  return {
    idiom: "universal",
    ...(dark ? { appearances: DARK_APPEARANCE } : {}),
    color: {
      "color-space": "srgb",
      components: {
        red: (r / 255).toFixed(16),
        green: (g / 255).toFixed(16),
        blue: (b / 255).toFixed(16),
        alpha: "1.000",
      },
    },
  };
};

const writeColorSet = async ({ dir, light, dark }) => {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  const colors = [colorEntry(light, false)];

  if (dark) {
    colors.push(colorEntry(dark, true));
  }

  await writeFile(join(dir, "Contents.json"), contents({ colors }));
};

/** Удаляет ассеты прошлых прогонов (у сторонних генераторов имена с хешем). */
const removeStaleAssets = async (dir, prefixes) => {
  if (!existsSync(dir)) {
    return;
  }

  for (const entry of await readdir(dir)) {
    if (prefixes.some(prefix => entry.startsWith(`${prefix}-`))) {
      await rm(join(dir, entry), { recursive: true, force: true });
    }
  }
};

export const generateIos = async (config, artworks) => {
  const projectPath = fromRoot(config.ios.projectPath);
  const images = join(projectPath, "Images.xcassets");
  const colors = join(projectPath, "Colors.xcassets");
  const { names } = config.ios;

  await removeStaleAssets(images, [names.logo, names.brand]);
  await removeStaleAssets(colors, [names.background]);

  await writeImageSet({
    dir: join(images, `${names.logo}.imageset`),
    name: "logo",
    light: artworks.light.logo,
    dark: artworks.dark?.logo,
  });

  if (artworks.light.brand) {
    await writeImageSet({
      dir: join(images, `${names.brand}.imageset`),
      name: "brand",
      light: artworks.light.brand,
      dark: artworks.dark?.brand,
    });
  }

  await writeColorSet({
    dir: join(colors, `${names.background}.colorset`),
    light: config.light.background,
    dark: config.dark?.background,
  });

  const { logo, brand } = artworks.light;

  await writeFile(
    join(projectPath, `${config.ios.storyboardName}.storyboard`),
    buildStoryboard({
      names,
      logo: {
        width: logo.widthDp,
        height: Math.round((logo.height / logo.width) * logo.widthDp),
      },
      brand: brand
        ? {
            width: brand.slot.width,
            height: brand.slot.height,
            bottom: config.ios.brandBottom,
          }
        : null,
      offsetY: config.ios.logoOffsetY,
    }),
  );

  log(
    `🍏  iOS: Images.xcassets, Colors.xcassets, ${config.ios.storyboardName}.storyboard`,
  );
};
