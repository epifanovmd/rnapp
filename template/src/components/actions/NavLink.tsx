import React, {FC, memo, useCallback} from 'react';
import {Touchable, FlexComponentProps} from '../ui';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {ScreenName} from '../../navigation';

interface IProps extends FlexComponentProps {
  to: ScreenName;
  screen?: ScreenName;
  params?: {[key in string]: string | number | undefined};
}

export const NavLink: FC<IProps> = memo(
  ({children, to, params, screen, ...rest}) => {
    const {navigate} = useNavigation<NavigationProp<any>>();

    const onPress = useCallback(() => {
      navigate(
        to,
        screen
          ? {
              screen,
              params,
            }
          : params,
      );
    }, [navigate, params, screen, to]);

    return (
      <Touchable {...rest} onPress={onPress}>
        {children}
      </Touchable>
    );
  },
);
