/** Строка-сообщение. */
export interface ILabMessageRow {
  type: "message";
  key: string;
  /** Порядковый номер — по нему видно, куда уехал список. */
  seq: number;
  text: string;
  /** Заданная высота: раскладка предсказуема, ошибки видно глазом. */
  height: number;
  author: string;
  /** День, к которому относится сообщение. */
  day: string;
  /** Последнее сообщение автора в группе — под ним рисуется аватар. */
  isGroupTail: boolean;
}

/** Строка тестового списка. */
export type LabRow =
  | ILabMessageRow
  | { type: "date"; key: string; day: string }
  | { type: "loader"; key: string; edge: "start" | "end" };

const AUTHORS = ["Аня", "Борис", "Вера", "Глеб"];
const HEIGHTS = [56, 84, 120, 68, 160, 92];

/** Высота и автор берутся детерминированно: прогоны сравнимы между собой. */
const authorOf = (seq: number) =>
  AUTHORS[Math.floor(seq / 3) % AUTHORS.length]!;
const heightOf = (seq: number) => HEIGHTS[seq % HEIGHTS.length]!;
const dayOf = (seq: number) => `День ${Math.floor(seq / 12) + 1}`;

export const createMessage = (seq: number): ILabMessageRow => ({
  type: "message",
  key: `m${seq}`,
  seq,
  text: `Сообщение ${seq}`,
  height: heightOf(seq),
  author: authorOf(seq),
  day: dayOf(seq),
  // Группа — три подряд сообщения одного автора; хвост несёт аватар.
  isGroupTail: seq % 3 === 2,
});

/** Диапазон сообщений `[from, to)`. */
export const createMessages = (from: number, to: number): ILabMessageRow[] =>
  Array.from({ length: Math.max(0, to - from) }, (_, index) =>
    createMessage(from + index),
  );

/**
 * Вставка разделителей дат между сообщениями разных дней.
 *
 * Возвращает и сами строки, и индексы разделителей — их ждёт список в наборе
 * прилипающих элементов.
 */
export const withDateSeparators = (
  messages: ILabMessageRow[],
): {
  rows: LabRow[];
  dateIndices: number[];
  avatarIndices: number[];
  groupStarts: number[];
} => {
  const rows: LabRow[] = [];
  const dateIndices: number[] = [];
  const avatarIndices: number[] = [];
  const groupStarts: number[] = [];

  let previousDay: string | undefined;
  // Первая строка текущей группы: до неё аватар подниматься не должен.
  let groupStart: number | undefined;

  for (const message of messages) {
    if (message.day !== previousDay) {
      previousDay = message.day;
      // Разделитель разрывает группу: следующее сообщение начинает новую.
      groupStart = undefined;
      dateIndices.push(rows.length);
      rows.push({ type: "date", key: `d-${message.day}`, day: message.day });
    }

    if (groupStart === undefined) groupStart = rows.length;

    if (message.isGroupTail) {
      avatarIndices.push(rows.length);
      groupStarts.push(groupStart);
      groupStart = undefined;
    }

    rows.push(message);
  }

  return { rows, dateIndices, avatarIndices, groupStarts };
};

/** Ключ строки для списка. */
export const labRowKey = (row: LabRow): string => row.key;

/** Тип контейнера: строки разной формы не должны переиспользовать друг друга. */
export const labRowType = (row: LabRow): string => row.type;

/** Высота известна заранее для всех строк, кроме сообщений с картинкой. */
export const labRowHeight = (row: LabRow): number | undefined => {
  if (row.type === "date") return DATE_ROW_HEIGHT;
  if (row.type === "loader") return LOADER_ROW_HEIGHT;

  return row.height;
};

/** Зазор между сообщениями; создаётся отступом сверху пузыря. */
export const MESSAGE_GAP = 8;

export const DATE_ROW_HEIGHT = 44;
export const LOADER_ROW_HEIGHT = 56;
