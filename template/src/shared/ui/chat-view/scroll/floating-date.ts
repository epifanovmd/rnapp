import { IDateSeparatorPosition } from "../data/chat-data";
import { IChatGeometry } from "./chat-geometry";

/**
 * Плавающая дата — порт расчётной части `FloatingDateManager.update()`.
 *
 * Плашка показывает дату той группы, чей разделитель уже ушёл под верхнюю
 * границу. Когда снизу подходит следующий разделитель, плашка «выталкивается»
 * им вверх (`pushOffset`) — эталон делает это трансформацией контейнера.
 */

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

/**
 * Функция вызывается на каждом кадре скролла, поэтому написана без единой
 * аллокации: один проход, две переменные, никаких промежуточных массивов.
 */
export const resolveFloatingDate = ({
  geometry,
  separators,
  pillRestY,
  pillHeight,
  spacing,
}: IResolveFloatingDateInput): IFloatingDateResult => {
  if (separators.length === 0) return HIDDEN;

  const restLimit = pillRestY - spacing;
  const triggerY = pillRestY + pillHeight + spacing;

  // Последний разделитель, ушедший выше позиции покоя плашки, и первый
  // разделитель после него: он-то её и выталкивает.
  let foundDate: string | null = null;
  let nextMinY: number | null = null;

  for (const separator of separators) {
    const top = geometry.rowTop(separator.rowIndex);
    const height = geometry.rowHeight(separator.rowIndex);

    if (top == null || height == null) continue;

    // Координаты на экране: список неподвижен и совпадает с корнем,
    // поэтому достаточно вычесть позицию скролла.
    const minY = top - geometry.scrollY;

    if (minY + height < restLimit) {
      foundDate = separator.groupDate;
      // Прошлый кандидат на «подпирающий» больше не актуален: найден
      // разделитель ещё ниже него.
      nextMinY = null;
      continue;
    }

    if (foundDate != null && nextMinY == null) {
      nextMinY = minY;
    }
    // Разделители идут по возрастанию позиции — ниже ничего интересного нет.
    if (minY > triggerY) break;
  }

  if (foundDate == null) return HIDDEN;

  return {
    groupDate: foundDate,
    pushOffset:
      nextMinY != null && nextMinY < triggerY
        ? Math.min(0, nextMinY - triggerY)
        : 0,
  };
};
