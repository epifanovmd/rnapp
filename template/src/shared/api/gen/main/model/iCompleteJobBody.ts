export interface ICompleteJobBody {
  attempt?: number;
  /** Результат задачи (JSON). */
  result?: unknown;
}
