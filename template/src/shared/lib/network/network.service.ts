import NetInfo from "@react-native-community/netinfo";
import { injectable } from "inversify";

import { INetworkStatusService } from "./network.types";

@injectable()
export class NetworkStatusService implements INetworkStatusService {
  private _isOnline = true;

  constructor() {
    NetInfo.addEventListener(state => {
      this._isOnline = Boolean(state.isConnected);
    });
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  onOnline(callback: () => void): () => void {
    let wasOffline = false;

    return NetInfo.addEventListener(state => {
      const isOnline = Boolean(state.isConnected);

      if (isOnline && wasOffline) callback();

      wasOffline = !isOnline;
    });
  }

  onOffline(callback: () => void): () => void {
    return NetInfo.addEventListener(state => {
      if (!state.isConnected) callback();
    });
  }
}
