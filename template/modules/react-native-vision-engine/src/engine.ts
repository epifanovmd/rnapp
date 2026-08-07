import type { BoxedHybridObject } from "react-native-nitro-modules";
import { NitroModules } from "react-native-nitro-modules";

import type { VisionEngine } from "./specs/VisionEngine.nitro";

let instance: VisionEngine | undefined;

/** Единственный экземпляр нативного движка (ленивая инициализация) */
export function getVisionEngine(): VisionEngine {
  if (instance == null) {
    instance = NitroModules.createHybridObject<VisionEngine>("VisionEngine");
  }

  return instance;
}

/**
 * Обёртка для использования в worklet-рантайме VisionCamera:
 * hybrid-объект пробрасывается в другой рантайм только в boxed-виде.
 */
export function getBoxedVisionEngine(): BoxedHybridObject<VisionEngine> {
  return NitroModules.box(getVisionEngine());
}
