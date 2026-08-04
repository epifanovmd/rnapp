import { AlphaType, ColorType, SkImage } from "@shopify/react-native-skia";

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

/** Нижняя граница альфы частицы: нативный аниматор поднимает бледные цвета. */
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

/**
 * Разбор снимка на частицы.
 *
 * Повторяет нативный `DisintegrationAnimator`: снимок опрашивается по сетке,
 * прозрачные ячейки отбрасываются, цвет каждой оставшейся становится цветом
 * её частиц. Стартуют частицы не из своей ячейки, а из случайной точки внутри
 * снимка — там эмиттер тоже прямоугольный, и именно это делает облако цельным,
 * а не сеткой точек.
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

  const imageWidth = image.width();
  const imageHeight = image.height();

  // Формат запрашивается явно: снимок вью на разных платформах приходит то
  // BGRA, то премультиплицированным, а распакованный сюда — всегда один и тот же.
  const pixels = image.readPixels(0, 0, {
    width: imageWidth,
    height: imageHeight,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });

  if (!pixels) return null;

  const scaleX = imageWidth / width;
  const scaleY = imageHeight / height;

  const grid = config.sampleGridSize;
  const cols = Math.max(1, Math.ceil(width / grid));
  const rows = Math.max(1, Math.ceil(height / grid));

  const cellColors: number[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = Math.min(
        Math.floor((col + 0.5) * grid * scaleX),
        imageWidth - 1,
      );
      const py = Math.min(
        Math.floor((row + 0.5) * grid * scaleY),
        imageHeight - 1,
      );
      const offset = (py * imageWidth + px) * 4;

      const alpha = pixels[offset + 3] / 255;

      if (alpha <= ALPHA_CUTOFF) continue;

      cellColors.push(
        pixels[offset] / 255,
        pixels[offset + 1] / 255,
        pixels[offset + 2] / 255,
        Math.max(alpha, ALPHA_FLOOR),
      );
    }
  }

  const cellCount = cellColors.length / 4;

  if (cellCount === 0) return null;

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
      // Частица должна успеть сжаться в ничто раньше, чем истечёт её жизнь.
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
    // Нативные `scaleSpeed`/`alphaSpeed` считаются от номинальной жизни, а не от
    // разбросанной: частица с короткой жизнью гаснет, не досохнув, — так и надо.
    scaleSpeed: -config.particleSize / config.lifetime,
    alphaSpeed: -1 / config.lifetime,
    gravity: config.gravity,
  };
};
