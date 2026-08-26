import {
  AlphaType,
  ColorType,
  Skia,
  SkImage,
} from "@shopify/react-native-skia";

/** Сторона спрайта в пикселях: белый квадрат, который тонируется цветом частицы. */
export const SPRITE_SIZE = 4;

let sprite: SkImage | null | undefined;

/**
 * Белый квадрат под все частицы приложения; цвет каждой даёт `colors` атласа.
 *
 * Собирается прямо из байтов, а не рисованием в offscreen-поверхность:
 * поверхность заводит GPU-контекст, и её снимок годен не в любой канве.
 * Результат кешируется, включая неудачу — пересоздавать нечего.
 */
export const particleSprite = (): SkImage | null => {
  if (sprite !== undefined) return sprite;

  const pixels = new Uint8Array(SPRITE_SIZE * SPRITE_SIZE * 4).fill(255);

  sprite = Skia.Image.MakeImage(
    {
      width: SPRITE_SIZE,
      height: SPRITE_SIZE,
      colorType: ColorType.RGBA_8888,
      alphaType: AlphaType.Opaque,
    },
    Skia.Data.fromBytes(pixels),
    SPRITE_SIZE * 4,
  );

  return sprite;
};
