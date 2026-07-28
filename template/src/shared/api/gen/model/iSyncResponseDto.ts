import type { SyncLogDto } from "./syncLogDto";

export interface ISyncResponseDto {
  changes: SyncLogDto[];
  currentVersion: string;
  hasMore: boolean;
  /**
   * true — версия клиента устарела, нужно сбросить кэш
   * и загрузить данные через обычные API endpoints заново.
   */
  requiresSnapshot: boolean;
}
