import type { HybridObject } from "react-native-nitro-modules";
import type { Frame } from "react-native-vision-camera";

/** Режим распознавания текста: скорость против точности */
export type OcrRecognitionMode = "fast" | "accurate";

/**
 * Подача кадра на вход модели детекции:
 * letterbox — масштаб с сохранением пропорций и полями,
 * stretch — растяжение на весь вход без сохранения пропорций.
 */
export type DetectorResizeMode = "letterbox" | "stretch";

/**
 * Единицы координат боксов в выходе модели: normalized — доли входа
 * [0..1], pixels — пиксели входа, auto — определить по значению.
 */
export type DetectorBoxUnits = "auto" | "normalized" | "pixels";

/**
 * Вычислитель инференса. Учитывается на Android (TFLite-делегат, при
 * недоступности — CPU); на iOS CoreML распределяет вычисления сам.
 */
export type DetectorAccelerator = "cpu" | "gpu" | "nnapi";

/**
 * Модель детекции и способ её прогона. Модель кладётся в приложение:
 * iOS — бандл `<name>.mlmodelc`/`<name>.mlpackage`, Android — assets
 * `<name>.tflite`. Не заданные поля берутся из `DETECTOR_DEFAULTS`.
 */
export interface DetectorModelConfig {
  /** Имя файла модели без расширения */
  name: string;
  /**
   * Имена классов по индексу; перекрывают имена из метаданных модели.
   * Нужны, только если модель своих имён не содержит.
   */
  labels?: string[];
  resize?: DetectorResizeMode;
  boxUnits?: DetectorBoxUnits;
  accelerator?: DetectorAccelerator;
  /** Потоки CPU-инференса (Android); 0 — по числу ядер */
  threads?: number;
}

/** Описание загруженной модели детекции */
export interface DetectorModelInfo {
  /** false — модель не найдена в бандле/assets */
  loaded: boolean;
  /** Имена классов по индексу; пусто — модель их не содержит и в конфиге не заданы */
  labels: string[];
  /** Число классов модели; 0 — не определено */
  classCount: number;
  /** Ширина входа модели, px */
  inputWidth: number;
  /** Высота входа модели, px */
  inputHeight: number;
}

/**
 * Прямоугольник в нормализованных координатах [0..1] выпрямленного кадра,
 * начало — левый верхний угол.
 */
export interface OcrRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Объект, найденный моделью детекции */
export interface DetectedObject {
  /** Индекс класса модели; -1 — класс не сопоставлен индексу */
  classIndex: number;
  /** Имя класса; пустая строка — имя неизвестно */
  label: string;
  score: number;
  rect: OcrRect;
}

/** Параметры детекции кадра */
export interface DetectOptions {
  /** Порог уверенности детекции */
  minScore: number;
  /** IoU-порог NMS (подавление — внутри класса) */
  iouThreshold?: number;
  /** Максимум детекций в результате, по убыванию score; не задано — все */
  maxResults?: number;
}

/** Строка текста, распознанная OCR */
export interface OcrObservation {
  text: string;
  /** Уверенность распознавания [0..1] */
  confidence: number;
  rect: OcrRect;
}

/** Область кадра, которую читает OCR */
export interface OcrRoi {
  rect: OcrRect;
  /** Расширение области перед чтением, доля её размеров */
  padding?: number;
}

/** Параметры распознавания текста */
export interface OcrOptions {
  mode: OcrRecognitionMode;
  /** Строки с уверенностью ниже порога отбрасываются */
  minConfidence: number;
  /** Максимум строк на область, по убыванию уверенности; не задано — все */
  maxObservations?: number;
  /**
   * Языки распознавания в порядке приоритета (iOS, коды BCP 47);
   * Android читает латиницу независимо от поля.
   */
  languages?: string[];
  /** Минимальная сторона области после расширения, px: меньшие не читаются */
  minRoiSizePx?: number;
}

/** Результат чтения одной области; индекс совпадает с индексом запроса */
export interface OcrRoiResult {
  /** Область прочитана; false — пропущена (меньше `minRoiSizePx`) */
  read: boolean;
  observations: OcrObservation[];
}

/**
 * Подготовленный кадр: операции распознавания над одним изображением.
 * Подготовка кадра (выпрямление, буферы) выполняется один раз на сессию.
 * Сессия действительна, пока жив исходный `Frame`; освобождается
 * `dispose()` до освобождения кадра. Методы синхронные — вызываются
 * из frame-worklet'а.
 */
export interface FrameSession extends HybridObject<{
  ios: "swift";
  android: "kotlin";
}> {
  /** Ширина выпрямленного кадра, px */
  readonly width: number;
  /** Высота выпрямленного кадра, px */
  readonly height: number;
  /**
   * Детекция загруженной моделью (`loadModel`), по убыванию score.
   * Бросает, если модель с таким именем не загружена.
   */
  detect(model: string, options: DetectOptions): DetectedObject[];
  /**
   * OCR областей кадра одним проходом; `result[i]` — текст `rois[i]`.
   * Полный кадр — область `{ x: 0, y: 0, width: 1, height: 1 }`.
   */
  recognize(rois: OcrRoi[], options: OcrOptions): OcrRoiResult[];
}

/**
 * Универсальный нативный движок зрения: примитивы детекции и OCR над
 * кадром, предметной области не знает — модели, порядок операций и
 * правила разбора задаёт JS.
 *
 * iOS — Apple Vision (`VNRecognizeTextRequest`) + CoreML;
 * Android — ML Kit Text Recognition + TFLite.
 */
export interface VisionEngine extends HybridObject<{
  ios: "swift";
  android: "kotlin";
}> {
  /**
   * Загрузить модель детекции; доступна в `FrameSession.detect` по
   * `config.name`. Повторная загрузка того же имени заменяет конфиг.
   */
  loadModel(config: DetectorModelConfig): Promise<DetectorModelInfo>;
  /** Открыть сессию распознавания кадра VisionCamera */
  openFrame(frame: Frame): FrameSession;
}
