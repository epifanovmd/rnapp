/** Занятый контейнером отрезок вдоль оси скролла. */
export interface IBlankAreaSpan {
  position: number;
  size: number;
}

export interface IBlankAreaParams {
  spans: IBlankAreaSpan[];
  viewportTop: number;
  viewportEnd: number;
}

/**
 * Незакрытая контейнерами часть вьюпорта, px.
 *
 * Зачем нужна: это единственная величина, по которой видно, что список не
 * успевает за скроллом. Пустая полоса живёт один кадр, глазом ловится как
 * мигание, а по счётчикам рендеров её не отличить от обычной работы.
 *
 * Отрезки приходят в произвольном порядке и могут перекрываться: контейнеры
 * прилипания стоят поверх соседей, а ожидающие измерения уведены за пределы
 * контента. Поэтому считается объединение, а не сумма длин.
 */
export const getBlankArea = ({
  spans,
  viewportTop,
  viewportEnd,
}: IBlankAreaParams): number => {
  const length = viewportEnd - viewportTop;

  if (length <= 0) return 0;

  const clipped = spans
    .map(span => ({
      start: Math.max(span.position, viewportTop),
      end: Math.min(span.position + span.size, viewportEnd),
    }))
    .filter(span => span.end > span.start)
    .sort((left, right) => left.start - right.start);

  let covered = 0;
  let reached = viewportTop;

  for (const span of clipped) {
    if (span.end <= reached) continue;

    covered += span.end - Math.max(span.start, reached);
    reached = span.end;
  }

  return Math.max(0, Math.round((length - covered) * 100) / 100);
};
