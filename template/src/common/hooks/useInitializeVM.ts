import {useEffect, useRef} from 'react';
import {useIsFocused} from '@react-navigation/native';
import {isFunction, SupportInitialize} from '@force-dev/utils';

export const useInitializeVM = <P, T>(
  vm: T & SupportInitialize<P> & {dispose?: () => void},
  props: P,
): Omit<T, 'initialize' | 'onFocusScreen'> => {
  const isInitialized = useRef(false);
  const {initialize, onFocusScreen} = vm;
  const isFocused = useIsFocused();

  useEffect(() => {
    if (onFocusScreen && isInitialized.current) {
      onFocusScreen(isFocused, props);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  useEffect(() => {
    isInitialized.current = true;
    if (initialize) {
      const dispose = initialize(props);
      if (isFunction(dispose)) {
        return dispose;
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return vm;
};
