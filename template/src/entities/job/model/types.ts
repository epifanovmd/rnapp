import type { JobRunDto } from "@shared/api/gen/main/model";
import { createInjectDecorator, SupportInitialize } from "@shared/lib/di";
import type { InfiniteHolder } from "@shared/lib/holders";
import type { ApiError, ApiResponse } from "@shared/lib/http";

export const IJobStore = createInjectDecorator<IJobStore>("IJobStore");

/** Фоновые задачи текущего пользователя; обновления приходят по сокету `job:updated`. */
export interface IJobStore {
  readonly jobsHolder: InfiniteHolder<JobRunDto>;
  readonly jobs: JobRunDto[];

  load(): Promise<void>;
  refresh(): Promise<void>;
  loadMore(): Promise<void>;
  /** Отменить задачу; новый статус придёт событием `job:updated`. */
  cancel(id: string): Promise<ApiResponse<void, ApiError>>;
  /** Поставить демо-задачу `demo.echo` (право `jobs:demo`). */
  startDemoEcho(text: string): Promise<ApiResponse<JobRunDto, ApiError>>;
  /** Новое состояние задачи: заменить в списке или добавить в начало. */
  handleJobUpdated(job: JobRunDto): void;
  reset(): void;
}

export const IJobRealtime = createInjectDecorator<IJobRealtime>("IJobRealtime");

/** Подписка на `job:updated` на время авторизованной сессии. */
export type IJobRealtime = SupportInitialize;
