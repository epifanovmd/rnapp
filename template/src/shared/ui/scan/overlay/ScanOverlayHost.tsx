import {
  IScanOverlayBox,
  IScanOverlaySnapshot,
  IViewSize,
  mapOverlayBoxes,
  smoothBoxes,
} from "@shared/lib/scan-overlay";
import { Canvas } from "@shopify/react-native-skia";
import React, { ReactElement, ReactNode, useCallback, useMemo } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import {
  SharedValue,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";
import type { Synchronizable } from "react-native-worklets";

/** Сколько держать рамки при сканах без результата (смаз, промах OCR), мс */
const DEFAULT_HOLD_EMPTY_MS = 600;
/** Убрать рамки, если сканы вовсе перестали приходить, мс */
const DEFAULT_STALE_MS = 1200;

/** Данные для слоёв отрисовки: сглаженные боксы в пикселях вью */
export interface IScanOverlayApi {
  boxes: SharedValue<IScanOverlayBox[]>;
  size: SharedValue<IViewSize>;
}

export interface IScanOverlayHostProps {
  /** Снимки распознавания с worklet-потока камеры */
  overlay: Synchronizable<IScanOverlaySnapshot>;
  holdEmptyMs?: number;
  staleMs?: number;
  /** Слои отрисовки (Skia-элементы); api передаётся пропсом, не контекстом */
  children: (api: IScanOverlayApi) => ReactNode;
}

/**
 * Хост оверлея сканера — механика без стилей: покадрово забирает снимок из
 * Synchronizable на UI-потоке (без React-рендеров), гасит мигание
 * (удержание рамок при пустых сканах + интерполяция позиций) и один раз
 * маппит боксы в координаты вью. Отрисовка — слоями-children.
 */
export const ScanOverlayHost = ({
  overlay,
  holdEmptyMs = DEFAULT_HOLD_EMPTY_MS,
  staleMs = DEFAULT_STALE_MS,
  children,
}: IScanOverlayHostProps): ReactElement => {
  const size = useSharedValue<IViewSize>({ width: 0, height: 0 });
  const boxes = useSharedValue<IScanOverlayBox[]>([]);
  const imageSize = useSharedValue<IViewSize>({ width: 0, height: 0 });
  const displayed = useSharedValue<IScanOverlayBox[]>([]);
  const targets = useSharedValue<IScanOverlayBox[]>([]);
  const lastRevision = useSharedValue(0);
  const lastBoxesAt = useSharedValue(0);
  const mappedView = useSharedValue<IViewSize>({ width: 0, height: 0 });
  const mappedImage = useSharedValue<IViewSize>({ width: 0, height: 0 });

  // Размер — через onLayout обёртки: `onSize` у Canvas измеряет вью каждый
  // UI-кадр и до первого лэйаута шумит предупреждением Reanimated.
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      size.value = {
        width: event.nativeEvent.layout.width,
        height: event.nativeEvent.layout.height,
      };
    },
    [size],
  );

  useFrameCallback(info => {
    const now = info.timestamp;
    const next = overlay.getDirty();

    if (next.revision !== lastRevision.value) {
      lastRevision.value = next.revision;
      if (next.imageWidth > 0) {
        imageSize.value = {
          width: next.imageWidth,
          height: next.imageHeight,
        };
      }
      if (next.boxes.length > 0) {
        targets.value = next.boxes;
        lastBoxesAt.value = now;
      } else if (now - lastBoxesAt.value > holdEmptyMs) {
        targets.value = [];
      }
    } else if (targets.value.length > 0 && now - lastBoxesAt.value > staleMs) {
      targets.value = [];
    }

    const smoothed = smoothBoxes(displayed.value, targets.value);
    const view = size.value;
    const image = imageSize.value;
    const geometryChanged =
      mappedView.value.width !== view.width ||
      mappedView.value.height !== view.height ||
      mappedImage.value.width !== image.width ||
      mappedImage.value.height !== image.height;

    if (!smoothed.settled || geometryChanged) {
      displayed.value = smoothed.boxes;
      mappedView.value = view;
      mappedImage.value = image;
      boxes.value = mapOverlayBoxes(
        smoothed.boxes,
        image.width,
        image.height,
        view,
      );
    }
  });

  const api = useMemo<IScanOverlayApi>(() => ({ boxes, size }), [boxes, size]);

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={"none"}
      onLayout={handleLayout}
    >
      <Canvas style={StyleSheet.absoluteFill}>{children(api)}</Canvas>
    </View>
  );
};
