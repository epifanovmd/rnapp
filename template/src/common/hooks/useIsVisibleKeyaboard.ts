import {useBoolean} from '@force-dev/react-mobile';
import {useEffect} from 'react';
import {Keyboard} from 'react-native';

export const useIsVisibleKeyboard = () => {
  const [visible, setVisible, setHide] = useBoolean();

  useEffect(() => {
    const listenerShow = Keyboard.addListener('keyboardWillShow', setVisible);
    const listenerHide = Keyboard.addListener('keyboardDidHide', setHide);

    return () => {
      listenerShow.remove();
      listenerHide.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return visible;
};
