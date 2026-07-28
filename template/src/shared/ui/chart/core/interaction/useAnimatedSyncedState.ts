import { useState } from "react";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export const useAnimatedSyncedState = <T>(
  compute: () => T,
  deps: unknown[],
  initial: T,
): T => {
  const [value, setValue] = useState<T>(initial);

  useAnimatedReaction(
    compute,
    (next, previous) => {
      if (next !== previous) {
        scheduleOnRN(setValue, next);
      }
    },
    deps,
  );

  return value;
};
