import { useEvent } from "@shared/lib/hooks";
import { useEffect, useRef } from "react";

export interface UseLoadMoreParams {
  onScrollEnd?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  /** Смена ключа (пришли новые строки) снова разрешает запрос. */
  resetKey: unknown;
}

/**
 * Запрос следующей страницы не чаще одного раза на порцию данных: события
 * скролла у конца идут каждый кадр, а флаг загрузки стратегии меняется
 * только после рендера.
 */
export const useLoadMore = ({
  onScrollEnd,
  hasMore,
  loading,
  loadingMore,
  resetKey,
}: UseLoadMoreParams) => {
  const requestedRef = useRef(false);

  useEffect(() => {
    requestedRef.current = false;
  }, [resetKey, loadingMore]);

  return useEvent(() => {
    if (!onScrollEnd || requestedRef.current) return;
    if (loading || loadingMore || hasMore === false) return;

    requestedRef.current = true;
    onScrollEnd();
  });
};
