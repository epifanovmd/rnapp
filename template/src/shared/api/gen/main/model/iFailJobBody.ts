export interface IFailJobBody {
  attempt?: number;
  /** Машинный код ошибки: `MODEL_NOT_FOUND`. */
  code: string;
  message: string;
  /** Повторять ли задачу (по умолчанию true). */
  retryable?: boolean;
}
