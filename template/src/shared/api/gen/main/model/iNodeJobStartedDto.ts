/**
 * Поставленная задача узла.
 */
export interface INodeJobStartedDto {
  /** Id задачи: прогресс и журнал — `GET /api/v1/jobs/{id}`, комната узла. */
  jobId: string;
}
