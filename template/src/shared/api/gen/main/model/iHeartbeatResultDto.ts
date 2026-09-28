export interface IHeartbeatResultDto {
  /** Задачу отменили или аренда потеряна — прекратить работу. */
  cancel: boolean;
  /**
   * Попросили завершить досрочно, но штатно: довести шаг и сдать результат
   * через complete.
   */
  stop: boolean;
}
