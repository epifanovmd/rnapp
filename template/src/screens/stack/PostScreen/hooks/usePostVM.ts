import { usePostDataStore, usePostsDataStore } from "@store";
import { useCallback } from "react";

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
