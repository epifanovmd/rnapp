import { TBarScrollEdge } from "./bars.types";

/**
 * Край списка важнее любого поведения панели: у верхней границы и на перелёте
 * сверху панель показана, на перелёте снизу — скрыта. Чистая функция, общая
 * для всех панелей; worklet-директива нужна для вызова с UI-потока.
 */
export const resolveScrollEdge = (
  offsetY: number,
  overscrollTop: number,
  overscrollBottom: number,
): TBarScrollEdge => {
  "worklet";

  if (overscrollTop > 0 || offsetY <= 0) {
    return "top";
  }

  if (overscrollBottom > 0) {
    return "bottom";
  }

  return null;
};
