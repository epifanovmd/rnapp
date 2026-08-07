import {
  buildBoxesPath,
  buildCornersPath,
  EMPTY_OCR_OVERLAY,
  IOcrOverlayBox,
  IOcrOverlaySnapshot,
  smoothBoxes,
} from "@shared/lib/ocr-scan";
import { Canvas, Path } from "@shopify/react-native-skia";
import React, { FC, memo, useCallback } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";
import type { Synchronizable } from "react-native-worklets";

/** Сколько держать рамки при сканах без результата (смаз, промах OCR), мс */
const HOLD_EMPTY_MS = 600;
/** Убрать рамки, если сканы вовсе перестали приходить, мс */
const STALE_MS = 1200;

export interface IOcrScanOverlayProps {
  /** Снимки распознавания с worklet-потока камеры */
  overlay: Synchronizable<IOcrOverlaySnapshot>;
  /** Цвет рамки валидного кандидата */
  validColor: string;
  /** Цвет рамки кандидата, не прошедшего доменную валидацию */
  candidateColor: string;
  /** Цвет обычных OCR-областей */
  textColor: string;
}

/**
 * Skia-оверлей поверх камеры: области распознавания рисуются на UI-потоке
 * без React-рендеров — снимок забирается из Synchronizable покадрово.
 * Против мигания: рамки удерживаются при пустых сканах (HOLD_EMPTY_MS),
 * позиции плавно интерполируются между сканами (`smoothBoxes`).
 */
export const OcrScanOverlay: FC<IOcrScanOverlayProps> = memo(
  ({ overlay, validColor, candidateColor, textColor }) => {
    const canvasSize = useSharedValue({ width: 0, height: 0 });
    const imageSize = useSharedValue({ width: 0, height: 0 });
    const displayed = useSharedValue<IOcrOverlayBox[]>([]);
    const targets = useSharedValue<IOcrOverlayBox[]>([]);
    const lastRevision = useSharedValue(0);
    const lastBoxesAt = useSharedValue(0);

    // Размер — через onLayout обёртки: `onSize` у Canvas измеряет вью каждый
    // UI-кадр и до первого лэйаута шумит предупреждением Reanimated.
    const handleLayout = useCallback(
      (event: LayoutChangeEvent) => {
        canvasSize.value = {
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height,
        };
      },
      [canvasSize],
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
        } else if (now - lastBoxesAt.value > HOLD_EMPTY_MS) {
          targets.value = [];
        }
      } else if (
        targets.value.length > 0 &&
        now - lastBoxesAt.value > STALE_MS
      ) {
        targets.value = [];
      }

      const smoothed = smoothBoxes(displayed.value, targets.value);

      if (!smoothed.settled) {
        displayed.value = smoothed.boxes;
      }
    });

    const textPath = useDerivedValue(() =>
      buildBoxesPath(displayed.value, imageSize.value, canvasSize.value, null),
    );
    const candidatePath = useDerivedValue(() =>
      buildCornersPath(
        displayed.value,
        imageSize.value,
        canvasSize.value,
        false,
      ),
    );
    const validPath = useDerivedValue(() =>
      buildCornersPath(
        displayed.value,
        imageSize.value,
        canvasSize.value,
        true,
      ),
    );

    return (
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents={"none"}
        onLayout={handleLayout}
      >
        <Canvas style={StyleSheet.absoluteFill}>
          <Path
            path={textPath}
            style={"stroke"}
            strokeWidth={1.5}
            color={textColor}
            opacity={0.45}
          />
          <Path
            path={candidatePath}
            style={"stroke"}
            strokeWidth={3}
            strokeCap={"round"}
            strokeJoin={"round"}
            color={candidateColor}
          />
          <Path
            path={validPath}
            style={"stroke"}
            strokeWidth={3.5}
            strokeCap={"round"}
            strokeJoin={"round"}
            color={validColor}
          />
        </Canvas>
      </View>
    );
  },
);
