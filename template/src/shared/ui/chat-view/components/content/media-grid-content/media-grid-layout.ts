import { IChatLayout } from "../../../config";
import { IChatMediaItem } from "../../../content";

/** Раскладка сетки вложений: высоты и фреймы ячеек. */

/** Максимум ячеек в сетке; остальные прячутся под оверлей «+N». */
export const MEDIA_GRID_MAX_VISIBLE = 4;

export interface IMediaGridFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Высота сетки: одиночное фото — по своим пропорциям, остальные — 3:4. */
export const mediaGridHeight = (
  media: IChatMediaItem[],
  width: number,
  layout: IChatLayout,
): number => {
  if (media.length === 0) return 0;

  if (media.length === 1) {
    const item = media[0];

    if (item.width && item.height && item.width > 0) {
      return Math.min(
        Math.max((width * item.height) / item.width, layout.imageMinHeight),
        layout.imageMaxHeight,
      );
    }

    return layout.imageMinHeight;
  }

  return Math.min(width * 0.75, layout.imageMaxHeight);
};

/** Прямоугольники ячеек для 1/2/3/4+ вложений. */
export const mediaGridFrames = (
  count: number,
  width: number,
  height: number,
  spacing: number,
): IMediaGridFrame[] => {
  const s = spacing;

  switch (count) {
    case 1:
      return [{ x: 0, y: 0, width, height }];

    case 2: {
      const w = (width - s) / 2;

      return [
        { x: 0, y: 0, width: w, height },
        { x: w + s, y: 0, width: width - w - s, height },
      ];
    }

    case 3: {
      const leftW = ((width - s) * 2) / 3;
      const rightW = width - leftW - s;
      const rightH = (height - s) / 2;

      return [
        { x: 0, y: 0, width: leftW, height },
        { x: leftW + s, y: 0, width: rightW, height: rightH },
        {
          x: leftW + s,
          y: rightH + s,
          width: rightW,
          height: height - rightH - s,
        },
      ];
    }

    default: {
      const w = (width - s) / 2;
      const h = (height - s) / 2;

      return [
        { x: 0, y: 0, width: w, height: h },
        { x: w + s, y: 0, width: width - w - s, height: h },
        { x: 0, y: h + s, width: w, height: height - h - s },
        { x: w + s, y: h + s, width: width - w - s, height: height - h - s },
      ];
    }
  }
};
