import type { ReactNode } from "react";
import type { SharedValue } from "react-native-reanimated";

import { POSITION_OUT_OF_VIEW } from "../model";
import type {
  IListRenderItemProps,
  IListStickyConfig,
  ListStickyEdge,
} from "../types";

/** Ниже этой позиции контейнер считается уведённым за пределы контента. */
const PARKED_THRESHOLD = POSITION_OUT_OF_VIEW / 2;

/** Что и как прилипает у конкретного контейнера. */
export interface IStickyPlacement {
  /**
   * `container` — прилипает вся строка целиком (заголовки, разделители дат).
   * `offset` — строка остаётся на месте, а смещение уходит в ячейку.
   */
  mode: "container" | "offset";
  /** Отступ кромки: навбар сверху, панель ввода и клавиатура снизу. */
  edgeOffset: SharedValue<number> | undefined;
  /** Высота того, что реально прилипает; по умолчанию — высота строки. */
  stickySize: number;
  /**
   * Прилипшую копию рисует слой поверх списка.
   *
   * Пока копия видна, узел внутри контента прячется — иначе на кромке стояли бы
   * два одинаковых элемента.
   */
  hasOverlay: boolean;
}

/**
 * Разбор конфигурации прилипания под один контейнер.
 *
 * Зачем нужен: наборы прилипающих элементов объявлены по кромкам, а контейнеру
 * нужен ответ про себя — прилипает он целиком или отдаёт смещение внутрь ячейки,
 * и от какой высоты считать предел подъёма.
 *
 * Обычная строка сюда тоже попадает: у неё нет кромки, и весь разбор сводится к
 * значениям по умолчанию.
 */
export const resolveStickyPlacement = (
  configs: IListStickyConfig[],
  edge: ListStickyEdge | null | undefined,
  size: number,
): IStickyPlacement => {
  const config = edge ? configs.find(item => item.edge === edge) : undefined;

  const mode = config?.mode ?? "container";

  return {
    mode,
    edgeOffset: config?.offset,
    stickySize: config?.size ?? size,
    hasOverlay:
      config !== undefined &&
      (config.renderOverlay !== undefined || mode === "container"),
  };
};

/** Как слой рисует прилипшую копию; undefined — эта кромка слой не использует. */
export type ListOverlayRenderer = (
  props: IListRenderItemProps<unknown>,
) => ReactNode;

/**
 * Чем рисовать прилипшую копию якоря.
 *
 * В режиме `container` копия — это сама строка, поэтому по умолчанию берётся
 * `renderItem`. В режиме `offset` у кромки стоит объект внутри строки, и
 * нарисовать его может только вызывающий: без его рендера кромка остаётся на
 * старом механизме.
 */
export const resolveOverlayRenderer = (
  config: IListStickyConfig,
  renderItem: ListOverlayRenderer,
): ListOverlayRenderer | undefined => {
  const { renderOverlay } = config;

  if (renderOverlay) {
    return ({ item, index }) => renderOverlay(item, index);
  }

  return (config.mode ?? "container") === "container" ? renderItem : undefined;
};

/**
 * Контейнер уведён за пределы контента и ждёт новой привязки.
 *
 * Формула прилипания вернула бы для него позицию ровно на кромке — на экране
 * это вторая копия прилипшего элемента, срывающаяся при снятии флага.
 */
export const isContainerParked = (position: number): boolean => {
  "worklet";

  return position <= PARKED_THRESHOLD;
};
