import {
  AlphaType,
  ColorType,
  Skia,
  SkImage,
} from "@shopify/react-native-skia";

import { IDisintegrateConfig } from "./disintegrate-config";

/** Число чисел на частицу в `motion`. */
export const MOTION_STRIDE = 8;

/** Смещения полей частицы внутри `motion`. */
export const MOTION_X = 0;
export const MOTION_Y = 1;
export const MOTION_VX = 2;
export const MOTION_VY = 3;
export const MOTION_BIRTH = 4;
export const MOTION_LIFE = 5;
export const MOTION_SPIN = 6;
export const MOTION_SIZE = 7;

/** Ниже этой альфы ячейка считается пустой и частиц не даёт. */
const ALPHA_CUTOFF = 0.02;

/** Нижняя граница альфы частицы: совсем бледные точки не видно. */
const ALPHA_FLOOR = 0.35;

/**
 * Частицы одного распада.
 *
 * Обычные массивы, а не типизированные: их читает воркет, и Reanimated
 * переносит в UI-рантайм именно обычный массив.
 */
export interface IDisintegrateParticles {
  count: number;
  /** Движение: по `MOTION_STRIDE` чисел на частицу. */
  motion: number[];
  /** Цвет: по 4 числа (r, g, b, a) в диапазоне 0..1 на частицу. */
  colors: number[];
  /** Скорость усыхания частицы (точки/сек), всегда отрицательная. */
  scaleSpeed: number;
  /** Скорость угасания частицы (альфа/сек), всегда отрицательная. */
  alphaSpeed: number;
  /** Ускорение вниз (точки/сек²). */
  gravity: number;
}

/** Формат выборки: снимок вью приходит то BGRA, то премультиплицированным. */
const GRID_FORMAT = {
  colorType: ColorType.RGBA_8888,
  alphaType: AlphaType.Unpremul,
} as const;

/**
 * Снимок → сетка `cols × rows` пикселей RGBA.
 *
 * Через уменьшающую отрисовку в растровую (не GPU) поверхность: полный
 * `readPixels` у сообщения с картинкой — это мегабайты в JS-куче ради двух сотен
 * значений. Заодно цвет ячейки получается усреднённым по её площади, а не
 * взятым из одной точки — края облака мягче.
 *
 * Если поверхность не создалась, читается снимок целиком и опрашивается по
 * центрам ячеек.
 */
const sampleGrid = (
  image: SkImage,
  cols: number,
  rows: number,
): Uint8Array | Float32Array | null => {
  const surface = Skia.Surface.Make(cols, rows);

  if (surface) {
    const source = Skia.XYWHRect(0, 0, image.width(), image.height());

    surface
      .getCanvas()
      .drawImageRect(
        image,
        source,
        Skia.XYWHRect(0, 0, cols, rows),
        Skia.Paint(),
      );

    const scaled = surface.makeImageSnapshot();
    const pixels = scaled.readPixels(0, 0, {
      ...GRID_FORMAT,
      width: cols,
      height: rows,
    });

    scaled.dispose();

    if (pixels) return pixels;
  }

  const imageWidth = image.width();
  const imageHeight = image.height();
  const full = image.readPixels(0, 0, {
    ...GRID_FORMAT,
    width: imageWidth,
    height: imageHeight,
  });

  if (!full) return null;

  const grid = new Uint8Array(cols * rows * 4);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = Math.min(
        Math.floor(((col + 0.5) / cols) * imageWidth),
        imageWidth - 1,
      );
      const py = Math.min(
        Math.floor(((row + 0.5) / rows) * imageHeight),
        imageHeight - 1,
      );
      const from = (py * imageWidth + px) * 4;
      const to = (row * cols + col) * 4;

      grid[to] = full[from];
      grid[to + 1] = full[from + 1];
      grid[to + 2] = full[from + 2];
      grid[to + 3] = full[from + 3];
    }
  }

  return grid;
};

/**
 * Разбор снимка на частицы.
 *
 * Снимок опрашивается по сетке, прозрачные ячейки отбрасываются, цвет каждой
 * оставшейся становится цветом её частиц. Стартуют частицы не из своей ячейки,
 * а из случайной точки внутри снимка — это делает облако цельным, а не сеткой
 * точек.
 *
 * Сам снимок дальше не нужен: от него остаются только цвета.
 */
export const buildDisintegrateParticles = (
  image: SkImage,
  width: number,
  height: number,
  config: IDisintegrateConfig,
): IDisintegrateParticles | null => {
  if (width <= 0 || height <= 0) return null;

  const grid = config.sampleGridSize;
  const cols = Math.max(1, Math.ceil(width / grid));
  const rows = Math.max(1, Math.ceil(height / grid));

  const pixels = sampleGrid(image, cols, rows);

  if (!pixels) return null;

  const cellColors: number[] = [];

  for (let cell = 0; cell < cols * rows; cell++) {
    const offset = cell * 4;
    const alpha = pixels[offset + 3] / 255;

    if (alpha <= ALPHA_CUTOFF) continue;

    cellColors.push(
      pixels[offset] / 255,
      pixels[offset + 1] / 255,
      pixels[offset + 2] / 255,
      Math.max(alpha, ALPHA_FLOOR),
    );
  }

  let cellCount = cellColors.length / 4;

  if (cellCount === 0) return null;

  // Потолок именно потолок: у крупного вложения ячеек может оказаться больше,
  // чем разрешено частиц, и «хотя бы по одной на ячейку» его бы перебило.
  cellCount = Math.min(cellCount, config.maxParticles);

  const perCell = Math.max(
    1,
    Math.min(
      config.particlesPerCell,
      Math.floor(config.maxParticles / cellCount),
    ),
  );
  const count = cellCount * perCell;

  const motion: number[] = new Array(count * MOTION_STRIDE);
  const colors: number[] = new Array(count * 4);

  for (let cell = 0; cell < cellCount; cell++) {
    for (let n = 0; n < perCell; n++) {
      const index = cell * perCell + n;
      const m = index * MOTION_STRIDE;
      const c = index * 4;

      const angle = Math.random() * Math.PI * 2;
      const speed = config.velocity * (0.5 + Math.random());
      const size =
        config.particleSize +
        config.particleSizeRange * (Math.random() * 2 - 1);

      motion[m + MOTION_X] = Math.random() * width;
      motion[m + MOTION_Y] = Math.random() * height;
      motion[m + MOTION_VX] = Math.cos(angle) * speed;
      motion[m + MOTION_VY] = Math.sin(angle) * speed;
      motion[m + MOTION_BIRTH] = Math.random() * config.burstDuration;
      motion[m + MOTION_LIFE] = config.lifetime * (0.6 + Math.random() * 0.8);
      motion[m + MOTION_SPIN] = config.spin * Math.random() * 2;
      motion[m + MOTION_SIZE] = Math.max(size, 0.1);

      colors[c] = cellColors[cell * 4];
      colors[c + 1] = cellColors[cell * 4 + 1];
      colors[c + 2] = cellColors[cell * 4 + 2];
      colors[c + 3] = cellColors[cell * 4 + 3];
    }
  }

  return {
    count,
    motion,
    colors,
    // Скорости считаются от номинальной жизни, а не от разбросанной: частица
    // с короткой жизнью гаснет, не досохнув, — так и надо.
    scaleSpeed: -config.particleSize / config.lifetime,
    alphaSpeed: -1 / config.lifetime,
    gravity: config.gravity,
  };
};
