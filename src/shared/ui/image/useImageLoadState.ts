import { useCallback, useEffect, useState } from "react";

import { initialImageLoadStatus, TImageLoadStatus } from "./image-load-state";

/**
 * Статус загрузки изображения: loading → loaded | error. Смена источника
 * перезапускает цикл (кэшированные картинки FastImage отдаёт мгновенно —
 * скелетон просто не успевает мигнуть).
 */
export const useImageLoadState = (source: string | number | undefined) => {
  const [status, setStatus] = useState<TImageLoadStatus>(() =>
    initialImageLoadStatus(source),
  );

  useEffect(() => {
    setStatus(initialImageLoadStatus(source));
  }, [source]);

  const handleLoad = useCallback(() => setStatus("loaded"), []);
  const handleError = useCallback(() => setStatus("error"), []);

  return { status, handleLoad, handleError };
};
