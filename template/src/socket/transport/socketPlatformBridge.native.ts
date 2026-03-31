import NetInfo from "@react-native-community/netinfo";
import { AppState } from "react-native";

import { ISocketPlatformBridge } from "./socketPlatformBridge.types";

@ISocketPlatformBridge({ inSingleton: true })
export class NativeSocketPlatformBridge implements ISocketPlatformBridge {
  isAppActive(): boolean {
    return AppState.currentState === "active";
  }

  onAppActive(callback: () => void): () => void {
    const sub = AppState.addEventListener("change", state => {
      if (state === "active") {
        callback();
      }
    });

    return () => sub.remove();
  }

  onNetworkOnline(callback: () => void): () => void {
    let wasOffline = false;

    const unsub = NetInfo.addEventListener(state => {
      if (state.isConnected && wasOffline) {
        callback();
      }
      wasOffline = !state.isConnected;
    });

    return unsub;
  }
}
