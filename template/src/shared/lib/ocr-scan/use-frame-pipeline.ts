import {
  EMPTY_SCAN_OVERLAY,
  IScanOverlayBox,
  IScanOverlaySnapshot,
} from "@shared/lib/scan-overlay";
import { useCallback, useMemo, useRef } from "react";
import type { BoxedHybridObject } from "react-native-nitro-modules";
import type { CameraFrameOutput, Frame } from "react-native-vision-camera";
import { useFrameOutput } from "react-native-vision-camera";
import type { VisionEngine } from "react-native-vision-engine";
import type { Synchronizable } from "react-native-worklets";
import { createSynchronizable } from "react-native-worklets";

/** Кэш worklet-рантайма камеры: unbox-нутые движки и таймстемпы троттлинга */
interface IFrameRuntimeCache {
  __visionEngines?: Record<string, VisionEngine>;
  __scanThrottle?: Record<string, number>;
}

let scannerSequence = 0;

/**
 * Уникальный ключ экземпляра сканера (стабилен на маунт): пространство
 * имён для worklet-кэша движка и ключей троттлинга — одновременные
 * сканеры не мешают друг другу.
 */
export function useScannerInstanceKey(prefix: string): string {
  return useMemo(() => `${prefix}#${++scannerSequence}`, [prefix]);
}

/**
 * Движок экземпляра в worklet-рантайме: unbox выполняется один раз на
 * ключ, дальше берётся из глобального кэша. Записи размонтированных
 * сканеров остаются в кэше — это тонкие обёртки, тяжёлые модели
 * кэшируются нативно по имени.
 */
export function getWorkletEngine(
  boxed: BoxedHybridObject<VisionEngine>,
  instanceKey: string,
): VisionEngine {
  "worklet";

  const cache = globalThis as IFrameRuntimeCache;
  const store = cache.__visionEngines ?? (cache.__visionEngines = {});

  if (store[instanceKey] == null) {
    store[instanceKey] = boxed.unbox();
  }

  return store[instanceKey];
}

/**
 * Worklet-троттлинг по ключу: true не чаще, чем раз в `intervalMs`.
 * Ключ обязан включать `useScannerInstanceKey`-префикс потребителя
 * ("ocr#1:texts", "object#2:emit", …), иначе экземпляры делят лимит.
 */
export function shouldEmit(key: string, intervalMs: number): boolean {
  "worklet";

  const cache = globalThis as IFrameRuntimeCache;
  const store = cache.__scanThrottle ?? (cache.__scanThrottle = {});
  const now = Date.now();

  if (now - (store[key] ?? 0) <= intervalMs) {
    return false;
  }
  store[key] = now;

  return true;
}

/** Публикация снимка рамок для оверлея (worklet) */
export function publishOverlay(
  overlay: Synchronizable<IScanOverlaySnapshot>,
  boxes: IScanOverlayBox[],
  imageWidth: number,
  imageHeight: number,
): void {
  "worklet";

  overlay.setBlocking(prev => ({
    boxes,
    imageWidth,
    imageHeight,
    revision: prev.revision + 1,
  }));
}

/** Канал снимков оверлея: worklet кадра пишет, UI-поток читает */
export function useOverlayChannel(): Synchronizable<IScanOverlaySnapshot> {
  return useMemo(
    () => createSynchronizable<IScanOverlaySnapshot>(EMPTY_SCAN_OVERLAY),
    [],
  );
}

/**
 * Стабильная обёртка колбэка для scheduleOnRN: ссылка не меняется между
 * рендерами, вызывается всегда актуальная версия.
 */
export function useStableCallback<TArgs extends unknown[]>(
  callback: ((...args: TArgs) => void) | undefined,
): (...args: TArgs) => void {
  const ref = useRef(callback);

  ref.current = callback;

  return useCallback((...args: TArgs) => {
    ref.current?.(...args);
  }, []);
}

function handleFrameDropped(): void {
  // no-op: дроп «frame-was-late» ожидаем, пока движок обрабатывает кадр
}

/**
 * Frame-output со стандартной конфигурацией конвейера зрения:
 * YUV, буферы размера preview (иначе cover-маппинг оверлея не совпадёт
 * с превью), молчаливый backpressure.
 */
export function useVisionFrameOutput(
  onFrame: (frame: Frame) => void,
): CameraFrameOutput {
  return useFrameOutput({
    pixelFormat: "yuv",
    enablePreviewSizedOutputBuffers: true,
    onFrame,
    onFrameDropped: handleFrameDropped,
  });
}
