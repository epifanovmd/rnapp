import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  OcrEngine,
  OcrRecognitionMode,
  OcrScanOptions,
} from "react-native-ocr-engine";
import { getBoxedOcrEngine, getOcrEngine } from "react-native-ocr-engine";
import type { CameraFrameOutput, Frame } from "react-native-vision-camera";
import { useFrameOutput } from "react-native-vision-camera";
import type { Synchronizable } from "react-native-worklets";
import { createSynchronizable, scheduleOnRN } from "react-native-worklets";

import { toUprightRect } from "./orientation";
import {
  EMPTY_OCR_OVERLAY,
  IOcrOverlayBox,
  IOcrOverlaySnapshot,
  IOcrScanDomain,
  IOcrScanObservation,
} from "./types";

const MAX_OVERLAY_BOXES = 10;
/** Период дебаг-лога сырых OCR-текстов, мс */
const TEXTS_LOG_INTERVAL_MS = 3000;
/** Троттлинг потока наблюдений в JS (onObservations), мс */
const OBSERVATIONS_INTERVAL_MS = 400;

interface IStreak {
  code: string;
  count: number;
}

function handleFrameDropped(): void {
  // no-op: дроп «frame-was-late» ожидаем, пока OCR обрабатывает кадр
}

/** Диагностика геометрии OCR — выполняется на RN-потоке */
function logDiagnostics(message: string): void {
  console.log(message);
}

/** Кэш worklet-рантайма камеры: unbox-нутый hybrid-объект и лог-состояние */
interface IOcrRuntimeCache {
  __ocrEngine?: OcrEngine;
  __ocrEngineLoggedOrientation?: string;
  __ocrEngineLastTextsLogAt?: number;
  __ocrEngineLastObservationsAt?: number;
}

export interface IUseOcrScannerProps<TAttributes> {
  /** Домен распознавания: извлечение кандидатов, стабилизация, детектор */
  domain: IOcrScanDomain<TAttributes>;
  /** Режим нативного OCR (iOS): fast — быстрее, accurate — точнее */
  mode?: OcrRecognitionMode;
  /** Стабилизированное значение подтверждено */
  onCandidateConfirmed?: (
    value: string,
    confidence: number,
    attributes: TAttributes,
  ) => void;
  /** Поток OCR-областей (троттлится) — для «сырых» сценариев */
  onObservations?: (observations: IOcrScanObservation[]) => void;
}

export interface IOcrScanner {
  frameOutput: CameraFrameOutput;
  /** Снимки распознавания для оверлея (читать через getDirty) */
  overlay: Synchronizable<IOcrOverlaySnapshot>;
  /** Сбросить стабилизацию и возобновить сканирование */
  resume: () => void;
}

/**
 * Универсальный frame-пайплайн сканера: нативный OCR на worklet-потоке
 * камеры, доменное извлечение кандидатов, стабилизация серией одинаковых
 * результатов, накопление доменных атрибутов и публикация областей для
 * оверлея. Домен задаёт `IOcrScanDomain`.
 */
export const useOcrScanner = <TAttributes>({
  domain,
  mode = "accurate",
  onCandidateConfirmed,
  onObservations,
}: IUseOcrScannerProps<TAttributes>): IOcrScanner => {
  const boxedOcr = useMemo(() => getBoxedOcrEngine(), []);
  const overlay = useMemo(
    () => createSynchronizable<IOcrOverlaySnapshot>(EMPTY_OCR_OVERLAY),
    [],
  );
  const streak = useMemo(
    () => createSynchronizable<IStreak>({ code: "", count: 0 }),
    [],
  );
  const suspended = useMemo(() => createSynchronizable<boolean>(false), []);
  const attributes = useMemo(
    () => createSynchronizable<TAttributes>(domain.emptyAttributes),
    // домен фиксируется на маунт
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (domain.detectorModelName !== null) {
      // детектор опционален: без обученной модели работает полнокадровый OCR
      getOcrEngine()
        .loadDetector(domain.detectorModelName)
        .catch(() => false);
    }
  }, [domain.detectorModelName]);

  const confirmedRef = useRef(onCandidateConfirmed);

  confirmedRef.current = onCandidateConfirmed;
  const handleConfirmed = useCallback(
    (value: string, confidence: number, scanAttributes: TAttributes) => {
      confirmedRef.current?.(value, confidence, scanAttributes);
    },
    [],
  );

  const observationsRef = useRef(onObservations);

  observationsRef.current = onObservations;
  const handleObservations = useCallback(
    (observations: IOcrScanObservation[]) => {
      observationsRef.current?.(observations);
    },
    [],
  );
  const hasObservationsListener = onObservations !== undefined;

  const onFrame = useMemo(() => {
    const scanOptions: OcrScanOptions = {
      mode,
      minConfidence: 0.25,
      maxObservations: 12,
    };

    return (frame: Frame) => {
      "worklet";

      try {
        if (suspended.getDirty()) {
          return;
        }

        const cache = globalThis as IOcrRuntimeCache;

        if (cache.__ocrEngine == null) {
          cache.__ocrEngine = boxedOcr.unbox();
        }
        const result = cache.__ocrEngine.scan(frame, scanOptions);

        // rect'ы приходят в координатах буфера — выпрямляем по ориентации
        const observations: IOcrScanObservation[] = result.observations.map(
          observation => ({
            text: observation.text,
            confidence: observation.confidence,
            fromDetector: observation.fromDetector,
            rect: toUprightRect(observation.rect, result.bufferOrientation),
          }),
        );

        const now = Date.now();

        if (
          cache.__ocrEngineLoggedOrientation !== result.bufferOrientation &&
          observations.length > 0
        ) {
          cache.__ocrEngineLoggedOrientation = result.bufferOrientation;
          scheduleOnRN(
            logDiagnostics,
            `[OcrScan] orientation=${result.bufferOrientation} ` +
              `image=${result.imageWidth}x${result.imageHeight}`,
          );
        }
        if (
          observations.length > 0 &&
          now - (cache.__ocrEngineLastTextsLogAt ?? 0) > TEXTS_LOG_INTERVAL_MS
        ) {
          cache.__ocrEngineLastTextsLogAt = now;
          let texts = "";

          for (let i = 0; i < Math.min(observations.length, 8); i++) {
            texts += (i > 0 ? " | " : "") + observations[i].text;
          }
          scheduleOnRN(logDiagnostics, `[OcrScan] texts: ${texts}`);
        }

        if (
          hasObservationsListener &&
          now - (cache.__ocrEngineLastObservationsAt ?? 0) >
            OBSERVATIONS_INTERVAL_MS
        ) {
          cache.__ocrEngineLastObservationsAt = now;
          scheduleOnRN(handleObservations, observations);
        }

        if (
          domain.extractAttributes !== null &&
          domain.mergeAttributes !== null
        ) {
          const frameAttributes = domain.extractAttributes(observations);
          const merge = domain.mergeAttributes;

          attributes.setBlocking(prev => merge(prev, frameAttributes));
        }

        const candidates = domain.extractCandidates(observations);
        const boxes: IOcrOverlayBox[] = [];

        for (let i = 0; i < candidates.length; i++) {
          boxes.push({
            rect: candidates[i].rect,
            isValidCandidate: candidates[i].isValid,
          });
        }
        for (
          let i = 0;
          i < observations.length && boxes.length < MAX_OVERLAY_BOXES;
          i++
        ) {
          boxes.push({
            rect: observations[i].rect,
            isValidCandidate: null,
          });
        }
        overlay.setBlocking(prev => ({
          boxes,
          imageWidth: result.imageWidth,
          imageHeight: result.imageHeight,
          revision: prev.revision + 1,
        }));

        // межкадровое накопление свидетельств кандидатов (голоса за код и т.п.)
        if (domain.accumulateCandidates !== null && candidates.length > 0) {
          const accumulate = domain.accumulateCandidates;

          attributes.setBlocking(prev => accumulate(prev, candidates));
        }

        const best =
          candidates.length > 0 && candidates[0].isValid ? candidates[0] : null;

        if (best !== null) {
          const previous = streak.getBlocking();
          const count = previous.code === best.value ? previous.count + 1 : 1;

          streak.setBlocking({ code: best.value, count });
        }

        // подтверждение: серия одинаковых сканов подряд ЛИБО вывод домена
        // из накопленных свидетельств; гейт полноты атрибутов — общий
        let confirmedValue: string | null = null;
        let confirmedConfidence = 0;

        if (
          best !== null &&
          streak.getBlocking().count >= domain.confirmStreak
        ) {
          confirmedValue = best.value;
          confirmedConfidence = best.confidence;
        } else if (domain.resolveAccumulated !== null) {
          const resolved = domain.resolveAccumulated(attributes.getBlocking());

          if (resolved !== null) {
            confirmedValue = resolved.value;
            confirmedConfidence = resolved.confidence;
          }
        }

        const attributesReady =
          domain.isComplete === null ||
          domain.isComplete(attributes.getBlocking());

        if (confirmedValue !== null && attributesReady) {
          suspended.setBlocking(true);
          streak.setBlocking({ code: "", count: 0 });
          overlay.setBlocking(prev => ({
            boxes: [],
            imageWidth: result.imageWidth,
            imageHeight: result.imageHeight,
            revision: prev.revision + 1,
          }));
          scheduleOnRN(
            handleConfirmed,
            confirmedValue,
            confirmedConfidence,
            attributes.getBlocking(),
          );
        }
      } finally {
        frame.dispose();
      }
    };
  }, [
    boxedOcr,
    overlay,
    streak,
    suspended,
    attributes,
    domain,
    mode,
    handleConfirmed,
    handleObservations,
    hasObservationsListener,
  ]);

  const frameOutput = useFrameOutput({
    pixelFormat: "yuv",
    // Кадры того же размера и поля зрения, что и preview-поток: только так
    // cover-маппинг оверлея совпадает с превью (иначе аспекты потоков разные
    // и боксы съезжают). Бонус — меньше данных на кадр для OCR.
    enablePreviewSizedOutputBuffers: true,
    onFrame,
    // Дропы кадров при занятом OCR — штатный backpressure (сканирование
    // медленнее 30 fps); дефолтный обработчик спамит console.warn.
    onFrameDropped: handleFrameDropped,
  });

  const resume = useCallback(() => {
    streak.setBlocking({ code: "", count: 0 });
    attributes.setBlocking(domain.emptyAttributes);
    overlay.setBlocking(prev => ({
      ...EMPTY_OCR_OVERLAY,
      revision: prev.revision + 1,
    }));
    suspended.setBlocking(false);
  }, [attributes, domain.emptyAttributes, overlay, streak, suspended]);

  return { frameOutput, overlay, resume };
};
