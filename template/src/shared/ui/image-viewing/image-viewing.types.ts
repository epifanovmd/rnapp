import type * as React from "react";

/** Источник изображения; строка в `images` — сахар для `{ uri }`. */
export interface IImageViewingSource {
  uri: string;
  /** Известные размеры — точный клэмп зума без ожидания загрузки. */
  width?: number;
  height?: number;
  /** Миниатюра, показывается до загрузки основного изображения. */
  previewUri?: string;
}

export type TImageViewingInput = IImageViewingSource | string;

/** Данные для кастомных шапки/подвала. */
export interface IImageViewingBarInfo {
  index: number;
  count: number;
  onClose: () => void;
}

export interface IImageViewingConfig {
  /** Максимальный pinch-зум. */
  maxScale: number;
  /** Зум по double-tap. */
  doubleTapScale: number;
  swipeToCloseEnabled: boolean;
  doubleTapToZoomEnabled: boolean;
}

export interface IImageViewingProps extends Partial<IImageViewingConfig> {
  images: ReadonlyArray<TImageViewingInput>;
  /** Начальный индекс при открытии. */
  imageIndex?: number;
  visible: boolean;
  onRequestClose: () => void;
  onIndexChange?: (index: number) => void;
  onLongPress?: (image: IImageViewingSource, index: number) => void;
  keyExtractor?: (image: IImageViewingSource, index: number) => string;
  backgroundColor?: string;
  /** Кастомная шапка; по умолчанию — счётчик и кнопка закрытия. */
  renderHeader?: (info: IImageViewingBarInfo) => React.ReactNode;
  /** Подвал (подпись, действия); по умолчанию отсутствует. */
  renderFooter?: (info: IImageViewingBarInfo) => React.ReactNode;
  /**
   * Кастомное содержимое слайда (видео, svg и т.п.) — жесты зума/закрытия
   * применяются к нему так же, как к изображению.
   */
  renderImage?: (image: IImageViewingSource, index: number) => React.ReactNode;
}
