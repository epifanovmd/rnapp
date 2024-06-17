import { useSessionDataStore } from "../SessionData.store";

export const useSession = () => {
  const { setToken } = useSessionDataStore();
};
