import { useCallback } from "react";

import { usePostsDataStore } from "../../../../store";

export const usePostsVM = () => {
  const { models, onRefresh, onLoadMore, loading } = usePostsDataStore();

  const refresh = useCallback(() => {
    return onRefresh();
  }, [onRefresh]);

  const loadMore = useCallback(() => {
    return onLoadMore();
  }, [onLoadMore]);

  return {
    list: models,
    loading,
    onRefresh: refresh,
    onLoadMore: loadMore,
  };
};
