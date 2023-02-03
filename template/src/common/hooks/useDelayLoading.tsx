import {useEffect, useRef, useState} from 'react';

export const useDelayLoading = (delay: number, load: boolean) => {
  const timeoutId = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (load && !timeoutId.current) {
      timeoutId.current = setTimeout(() => {
        setLoading(true);
      }, delay);
    } else if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  return loading;
};
