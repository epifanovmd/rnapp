import { useCallback } from "react";

import { usePostDataStore, usePostsDataStore } from "~@store";

export const usePostVM = (id: number) => {
  const { data, model, onRefresh, loading } = usePostDataStore();

  const refresh = useCallback(() => {
    return onRefresh(id);
  }, [onRefresh, id]);

  return {
    model,
    data,
    loading,
    onRefresh: refresh,
  };
};
