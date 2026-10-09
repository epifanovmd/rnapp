import type {
  INodeMeshCellDto,
  INodeMeshDto,
} from "@shared/api/gen/main/model";

/** Состояние пары: `down` — нет ответа хотя бы в одну сторону, `loss` — потери. */
export type TMeshPairStatus = "ok" | "loss" | "down";

/** Одно направление пары «откуда → куда». */
export interface IMeshDirectionView {
  key: string;
  fromName: string;
  toName: string;
  /** Подробности круга проверки одной строкой. */
  details: string;
}

export interface IMeshPairView {
  key: string;
  aName: string;
  bName: string;
  status: TMeshPairStatus;
  /** Нет свежих данных ни в одну сторону. */
  stale: boolean;
  /** Подпись задержки: «43 мс», при асимметрии — «43 / 51 мс». */
  rttLabel: string | null;
  /** Наибольшие потери в паре, %. */
  lossPct: number;
  directions: IMeshDirectionView[];
}

/** Задержка: до 10 мс — с десятыми, дальше — целыми. */
export const formatRtt = (rttMs: number): string =>
  rttMs < 10 ? rttMs.toFixed(1) : String(Math.round(rttMs));

const rttLabel = (cells: INodeMeshCellDto[]): string | null => {
  const values = [
    ...new Set(
      cells.flatMap(cell =>
        cell.rttAvgMs === null ? [] : [formatRtt(cell.rttAvgMs)],
      ),
    ),
  ];

  return values.length ? `${values.join(" / ")} мс` : null;
};

/**
 * Круг проверки одной строкой: устаревание и ошибка, задержка мин / сред /
 * макс, ответы, потери и чем проверено.
 */
export const describeMeshCell = (cell: INodeMeshCellDto): string => {
  const method =
    cell.via && cell.via !== cell.method
      ? `${cell.method} → ${cell.via}`
      : cell.method;
  const rtt =
    cell.rttAvgMs === null
      ? "не отвечает"
      : `задержка ${[cell.rttMinMs, cell.rttAvgMs, cell.rttMaxMs]
          .map(value => (value === null ? "—" : formatRtt(value)))
          .join(" / ")} мс`;

  return [
    ...(cell.stale ? ["нет свежих данных"] : []),
    ...(cell.error ? [cell.error] : []),
    rtt,
    `ответов ${cell.received} из ${cell.sent}`,
    `потери ${cell.lossPct}%`,
    method,
  ].join(" · ");
};

/** Связность парами узлов: оба направления в одной записи; без замеров — нет. */
export const meshPairs = (mesh: INodeMeshDto): IMeshPairView[] => {
  const cells = new Map(
    mesh.cells.map(cell => [`${cell.from}:${cell.to}`, cell]),
  );
  const names = new Map(mesh.nodes.map(node => [node.id, node.name]));

  return mesh.nodes.flatMap((a, index) =>
    mesh.nodes.slice(index + 1).flatMap(b => {
      const pair = [
        cells.get(`${a.id}:${b.id}`),
        cells.get(`${b.id}:${a.id}`),
      ].filter((cell): cell is INodeMeshCellDto => !!cell);

      if (!pair.length) return [];

      const lossPct = Math.max(...pair.map(cell => cell.lossPct));
      const status: TMeshPairStatus = pair.some(cell => cell.rttAvgMs === null)
        ? "down"
        : lossPct > 0
          ? "loss"
          : "ok";

      return [
        {
          key: `${a.id}:${b.id}`,
          aName: a.name,
          bName: b.name,
          status,
          stale: pair.every(cell => cell.stale),
          rttLabel: rttLabel(pair),
          lossPct,
          directions: pair.map(cell => ({
            key: `${cell.from}:${cell.to}`,
            fromName: names.get(cell.from) ?? cell.from,
            toName: names.get(cell.to) ?? cell.to,
            details: describeMeshCell(cell),
          })),
        },
      ];
    }),
  );
};

/** Состав матрицы: id, название и адрес узлов — сменился, матрицу перечитать. */
export const meshKey = (
  nodes: Array<{ id: string; name: string; host: string | null }>,
): string =>
  nodes.map(node => `${node.id}:${node.name}:${node.host ?? ""}`).join("|");
