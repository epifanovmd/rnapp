import { createInjectDecorator } from "@shared/lib/di";

/**
 * Абстракция над состоянием сетевого подключения.
 * Web: navigator.onLine + window "online"/"offline". React Native: NetInfo.
 */
export const INetworkStatusService =
  createInjectDecorator<INetworkStatusService>("INetworkStatusService");

export interface INetworkStatusService {
  readonly isOnline: boolean;

  onOnline(callback: () => void): () => void;
  onOffline(callback: () => void): () => void;
}
