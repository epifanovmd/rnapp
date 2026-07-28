import type { ESyncAction } from "./eSyncAction";
import type { ESyncEntityType } from "./eSyncEntityType";
import type { RecordStringUnknown } from "./recordStringUnknown";

export interface SyncLogDto {
  version: string;
  entityType: ESyncEntityType;
  entityId: string;
  entityKey: string;
  action: ESyncAction;
  /** @nullable */
  scopeId: string | null;
  payload: RecordStringUnknown | null;
  createdAt: string;
}
