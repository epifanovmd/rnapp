import type { BoxedHybridObject } from "react-native-nitro-modules";
import { NitroModules } from "react-native-nitro-modules";

import type { VisionEngine } from "./specs/VisionEngine.nitro";

let instance: VisionEngine | undefined;

/**
 * Разделяемый экземпляр движка (ленивая инициализация) — для одиночных
 * сценариев. Несколько одновременных сканеров с разными моделями должны
 * использовать `createVisionEngine`: слоты моделей у экземпляров раздельные.
 */
export function getVisionEngine(): VisionEngine {
  if (instance == null) {
    instance = NitroModules.createHybridObject<VisionEngine>("VisionEngine");
  }

  return instance;
}

/**
 * Отдельный экземпляр движка со своими слотами моделей — по одному на
 * сканер. Тяжёлые модели кэшируются нативно по имени, поэтому создание
 * экземпляра и повторный `loadDetector`/`loadObjectModel` дёшевы.
 */
export function createVisionEngine(): VisionEngine {
  return NitroModules.createHybridObject<VisionEngine>("VisionEngine");
}

/**
 * Обёртка для использования в worklet-рантайме VisionCamera:
 * hybrid-объект пробрасывается в другой рантайм только в boxed-виде.
 */
export function getBoxedVisionEngine(): BoxedHybridObject<VisionEngine> {
  return NitroModules.box(getVisionEngine());
}

/** Boxed-обёртка отдельного экземпляра (см. `createVisionEngine`) */
export function createBoxedVisionEngine(): BoxedHybridObject<VisionEngine> {
  return NitroModules.box(createVisionEngine());
}
