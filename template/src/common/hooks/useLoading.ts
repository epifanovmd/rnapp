import {useCallback, useState} from 'react';

type Loading = [boolean, () => void, () => void];

export const useLoading = (): Loading => {
  const [loading, setLoading] = useState(false);

  const start = useCallback(() => {
    setLoading(true);
  }, [setLoading]);

  const stop = useCallback(() => {
    setLoading(false);
  }, [setLoading]);

  return [loading, start, stop];
};
