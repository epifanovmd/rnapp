import { TBarScrollEdge } from "./bars.types";

/**
 * Край списка важнее любого поведения панели: у верхней границы и на перелёте
 * сверху панель показана, на перелёте снизу — скрыта. Контент, который не
 * прокручивается (`maxOffsetY <= 0`), — всегда «верх»: bounce короткого
 * экрана даёт перелёт снизу, но прятать панель незачем (места не прибавится),
 * а вернуть её прокруткой нельзя. Чистая функция, общая для всех панелей;
 * worklet-директива нужна для вызова с UI-потока.
 */
export const resolveScrollEdge = (
  offsetY: number,
  overscrollTop: number,
  overscrollBottom: number,
  maxOffsetY: number,
): TBarScrollEdge => {
  "worklet";

  if (maxOffsetY <= 0 || overscrollTop > 0 || offsetY <= 0) {
    return "top";
  }

  if (overscrollBottom > 0) {
    return "bottom";
  }

  return null;
};
