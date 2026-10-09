/**
 * Связность «откуда → куда» по последнему кругу проверки воркера `netprobe`.
 */
export interface INodeMeshCellDto {
  /** Узел, агент которого проверял. */
  from: string;
  /** Проверяемый узел. */
  to: string;
  /** `icmp` | `tcp`. */
  method: string;
  /** Чем проверено на деле (запасной путь, если ICMP недоступен). */
  via?: string;
  sent: number;
  received: number;
  /** Доля потерянных запросов, %. */
  lossPct: number;
  /**
   * Задержка, мс; `null` — ответов не было.
   * @nullable
   */
  rttAvgMs: number | null;
  /** @nullable */
  rttMinMs: number | null;
  /** @nullable */
  rttMaxMs: number | null;
  /** Когда закончен круг (часы узла), мс. */
  at: number;
  /** Итог старый: агент перестал проверять или не на связи. */
  stale: boolean;
  /** Ошибка проверки (имя не разрешилось, порт закрыт …). */
  error?: string;
}
