import { IScanOverlaySnapshot } from "@shared/lib/scan-overlay";
import React, { FC, memo, ReactNode } from "react";
import type { Synchronizable } from "react-native-worklets";

import { OverlayFrames } from "./OverlayFrames";
import { IScanOverlayApi, ScanOverlayHost } from "./ScanOverlayHost";

/** Цвета стандартных слоёв оверлея */
export interface IScanOverlayColors {
  /** Обычные OCR-области */
  text: string;
  /** Кандидат, не прошедший доменную валидацию */
  candidate: string;
  /** Валидный кандидат */
  valid: string;
  /** Регион детектора / обнаруженный объект */
  region: string;
}

export interface IScanOverlayProps {
  /** Снимки распознавания с worklet-потока камеры */
  overlay: Synchronizable<IScanOverlaySnapshot>;
  colors: IScanOverlayColors;
  /** Дополнительные слои поверх стандартных (OverlayLabels, OverlayDim, …) */
  children?: (api: IScanOverlayApi) => ReactNode;
}

/**
 * Стандартная сборка оверлея сканера: уголки региона детектора, тонкие
 * рамки OCR-областей, уголки кандидата и валидного значения. Расширяется
 * слоями-children; полностью свой набор слоёв — через `ScanOverlayHost`.
 */
export const ScanOverlay: FC<IScanOverlayProps> = memo(
  ({ overlay, colors, children }) => (
    <ScanOverlayHost overlay={overlay}>
      {api => (
        <>
          <OverlayFrames
            api={api}
            kind={"region"}
            color={colors.region}
            strokeWidth={2.5}
            opacity={0.9}
          />
          <OverlayFrames
            api={api}
            kind={"text"}
            variant={"box"}
            color={colors.text}
            opacity={0.45}
          />
          <OverlayFrames
            api={api}
            kind={"candidate"}
            color={colors.candidate}
          />
          <OverlayFrames
            api={api}
            kind={"valid"}
            color={colors.valid}
            strokeWidth={3.5}
          />
          {children?.(api)}
        </>
      )}
    </ScanOverlayHost>
  ),
);
