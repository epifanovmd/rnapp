import { injectable } from "inversify";
import { AppState as RNAppState } from "react-native";

import { IAppStateService } from "./app-state.types";

@injectable()
export class AppStateService implements IAppStateService {
  get isActive(): boolean {
    return RNAppState.currentState === "active";
  }

  /** Только смена активности: iOS шлёт `inactive` и повторы, их отбрасываем. */
  onChange(callback: (isActive: boolean) => void): () => void {
    let last = this.isActive;

    const sub = RNAppState.addEventListener("change", state => {
      const isActive = state === "active";

      if (isActive === last) return;

      last = isActive;
      callback(isActive);
    });

    return () => sub.remove();
  }
}
