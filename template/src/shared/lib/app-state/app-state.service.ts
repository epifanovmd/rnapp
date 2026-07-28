import { injectable } from "inversify";
import { AppState as RNAppState } from "react-native";

import { IAppStateService } from "./app-state.types";

@injectable()
export class AppStateService implements IAppStateService {
  get isActive(): boolean {
    return RNAppState.currentState === "active";
  }

  onChange(callback: (isActive: boolean) => void): () => void {
    const sub = RNAppState.addEventListener("change", state => {
      callback(state === "active");
    });

    return () => sub.remove();
  }
}
