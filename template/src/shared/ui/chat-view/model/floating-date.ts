import { IChatGeometry } from "./chat-geometry";

/**
 * Плавающая дата — порт расчётной части `FloatingDateManager.update()`.
 *
 * Плашка показывает дату той группы, чей разделитель уже ушёл под верхнюю
 * границу. Когда снизу подходит следующий разделитель, плашка «выталкивается»
 * им вверх (`pushOffset`) — эталон делает это трансформацией контейнера.
 */

export interface IDateSeparatorPosition {
  rowIndex: number;
  groupDate: string;
}

export interface IFloatingDateResult {
  /** Дата, которую показывает плашка, либо `null` — скрыть. */
  groupDate: string | null;
  /**
   * Смещение плашки вверх, когда следующий разделитель подпирает её снизу
   * (отрицательное или 0). Порт `container.transform`.
   */
  pushOffset: number;
}

const HIDDEN: IFloatingDateResult = { groupDate: null, pushOffset: 0 };

export interface IResolveFloatingDateInput {
  geometry: IChatGeometry;
  separators: IDateSeparatorPosition[];
  /** Позиция покоя плашки от верха вьюпорта. Порт `pillRestY`. */
  pillRestY: number;
  /** Высота плашки. */
  pillHeight: number;
  /** Порт `layout.sectionSpacing`. */
  spacing: number;
}

export const resolveFloatingDate = ({
  geometry,
  separators,
  pillRestY,
  pillHeight,
  spacing,
}: IResolveFloatingDateInput): IFloatingDateResult => {
  if (separators.length === 0) return HIDDEN;

  // Координаты разделителей на экране: список неподвижен и совпадает с
  // корнем, поэтому достаточно вычесть позицию скролла.
  const onScreen: { groupDate: string; minY: number; maxY: number }[] = [];

  for (const separator of separators) {
    const top = geometry.rowTop(separator.rowIndex);
    const height = geometry.rowHeight(separator.rowIndex);

    if (top == null || height == null) continue;

    const minY = top - geometry.scrollY;

    onScreen.push({
      groupDate: separator.groupDate,
      minY,
      maxY: minY + height,
    });
  }

  if (onScreen.length === 0) return HIDDEN;

  // Последний разделитель, ушедший выше позиции покоя плашки.
  let foundIndex = -1;

  for (let i = 0; i < onScreen.length; i++) {
    if (onScreen[i].maxY < pillRestY - spacing) {
      foundIndex = i;
    }
  }

  if (foundIndex < 0) return HIDDEN;

  const next = onScreen[foundIndex + 1];
  const triggerY = pillRestY + pillHeight + spacing;

  return {
    groupDate: onScreen[foundIndex].groupDate,
    pushOffset:
      next && next.minY < triggerY ? Math.min(0, next.minY - triggerY) : 0,
  };
};
