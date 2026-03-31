import { createServiceDecorator } from "@di";

/**
 * Abstraction over platform-specific lifecycle and network APIs.
 *
 * Web: document.visibilityState + window "online" event.
 * React Native: AppState + NetInfo.
 */
export const ISocketPlatformBridge =
  createServiceDecorator<ISocketPlatformBridge>();

export interface ISocketPlatformBridge {
  /** Returns true when the app/tab is in the foreground and visible. */
  isAppActive(): boolean;

  /** Fires callback every time the app/tab comes back to the foreground. Returns unsubscribe. */
  onAppActive(callback: () => void): () => void;

  /** Fires callback when network connectivity is restored. Returns unsubscribe. */
  onNetworkOnline(callback: () => void): () => void;
}
