import { useCallback } from "react";

import { useUsersDataStore } from "../../../../store";

export const useUsersVM = () => {
  const usersDataStore = useUsersDataStore();

  const onRefresh = useCallback(() => {
    return usersDataStore.onRefresh();
  }, [usersDataStore]);

  return {
    list: usersDataStore.holder.d || [],
    loading: usersDataStore.loading,
    loaded: usersDataStore.loaded,
    onRefresh,
  };
};
