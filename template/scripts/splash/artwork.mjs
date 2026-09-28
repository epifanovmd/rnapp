import {
  canvas,
  fitToWidth,
  MASTER_SCALE,
  measure,
  renderFile,
  renderText,
} from "./image.mjs";

/**
 * Один элемент композиции: файл (`image`), текст (`text`) или эмодзи (`emoji`).
 * Возвращает PNG в мастер-разрешении.
 */
const renderItem = item => {
  if (item.image) {
    return renderFile(item.image);
  }

  const isEmoji = Boolean(item.emoji);
  const text = isEmoji ? item.emoji : item.text;

  if (!text) {
    throw new Error(
      `Элемент источника должен задавать image, text или emoji: ${JSON.stringify(item)}`,
    );
  }

  return renderText({
    text,
    font: item.font ?? (isEmoji ? "Apple Color Emoji" : "sans"),
    size: item.size ?? (isEmoji ? 120 : 44),
    color: item.color,
  });
};

/**
 * Композиция источника: один элемент или вертикальная стопка (`stack`)
 * с выравниванием и отступом между элементами.
 */
export const buildArtwork = async spec => {
  const items = spec.stack ?? [spec];
  const rendered = [];

  for (const item of items) {
    const buffer = await renderItem(item);
    const meta = await measure(buffer);

    rendered.push({ buffer, width: meta.width, height: meta.height });
  }

  if (rendered.length === 1) {
    return rendered[0];
  }

  const gap = Math.round((spec.gap ?? 16) * MASTER_SCALE);
  const align = spec.align ?? "center";
  const width = Math.max(...rendered.map(item => item.width));
  const height =
    rendered.reduce((sum, item) => sum + item.height, 0) +
    gap * (rendered.length - 1);

  let top = 0;

  const composite = rendered.map(item => {
    const left =
      align === "left"
        ? 0
        : align === "right"
          ? width - item.width
          : Math.round((width - item.width) / 2);
    const entry = { input: item.buffer, left, top };

    top += item.height + gap;

    return entry;
  });

  const buffer = await canvas(width, height)
    .composite(composite)
    .png()
    .toBuffer();

  return { buffer, width, height };
};

/** Мастер-изображения и размеры слотов для одной темы. */
const prepareTheme = async (theme, config) => {
  if (!theme) {
    return undefined;
  }

  const result = {};

  if (theme.logo) {
    result.logo = {
      ...(await buildArtwork(theme.logo)),
      widthDp: theme.logo.width ?? config.logo.width,
      slot: config.logo.slot,
    };
  }

  if (theme.brand) {
    const slot = config.brand.slot;

    result.brand = {
      ...(await buildArtwork(theme.brand)),
      widthDp: Math.min(theme.brand.width ?? config.brand.width, slot.width),
      slot,
    };
  }

  return result;
};

/** Артворки обеих тем: `dark` отсутствует, если секции нет в конфиге. */
export const prepareArtworks = async config => {
  const artworks = {
    light: await prepareTheme(config.light, config),
    dark: await prepareTheme(config.dark, config),
  };

  if (!artworks.light?.logo) {
    throw new Error("В конфиге не задан light.logo");
  }

  return artworks;
};

export { fitToWidth };
