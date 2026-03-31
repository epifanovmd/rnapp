import { createServiceDecorator } from "@di";

export const ISyncStore = createServiceDecorator<ISyncStore>();

export interface ISyncStore {
  lastSyncVersion: string | null;
  isSyncing: boolean;

  sync(): Promise<void>;
  handleSyncAvailable(version: string): void;
}
