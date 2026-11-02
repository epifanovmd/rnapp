/** Прямоугольник top-left origin: нормализованный [0..1] или в пикселях вью */
export interface IScanRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Категория бокса оверлея — слои отрисовки фильтруют боксы по ней */
export type TScanOverlayBoxKind =
  /** обычная OCR-область */
  | "text"
  /** кандидат, не прошедший доменную валидацию */
  | "candidate"
  /** валидный кандидат */
  | "valid"
  /** регион детектора / обнаруженный объект */
  | "region";

/** Бокс оверлея; в снимке rect нормализован, после маппинга — пиксели вью */
export interface IScanOverlayBox {
  rect: IScanRect;
  kind: TScanOverlayBoxKind;
  /** Подпись бокса (метка класса, значение кандидата) — для слоя подписей */
  label?: string;
}

/** Снимок распознавания одного кадра для отрисовки оверлея */
export interface IScanOverlaySnapshot {
  boxes: IScanOverlayBox[];
  imageWidth: number;
  imageHeight: number;
  /** Монотонный номер снимка — оверлей перерисовывается только по изменению */
  revision: number;
}

export const EMPTY_SCAN_OVERLAY: IScanOverlaySnapshot = {
  boxes: [],
  imageWidth: 0,
  imageHeight: 0,
  revision: 0,
};
