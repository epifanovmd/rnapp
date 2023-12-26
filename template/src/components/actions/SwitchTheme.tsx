import React, {FC, memo, PropsWithChildren} from 'react';
import SwitchToggle from 'react-native-switch-toggle';
import {DEFAULT_LIGHT_THEME_ID, useTheme} from '../../theme';
import {FlexProps, Row} from '@force-dev/react-mobile';

interface IProps extends FlexProps {}

export const SwitchTheme: FC<PropsWithChildren<IProps>> = memo(({...rest}) => {
  const {theme, toggleTheme} = useTheme();

  return (
    <Row pa={32} {...rest}>
      <SwitchToggle
        switchOn={theme.id === DEFAULT_LIGHT_THEME_ID}
        backTextRight={theme.id === DEFAULT_LIGHT_THEME_ID ? 'Light' : 'Dark'}
        buttonStyle={{
          position: 'absolute',
          zIndex: 10,
          backgroundColor: '#62c28e',
          marginLeft: theme.id === DEFAULT_LIGHT_THEME_ID ? -2 : 2,
        }}
        buttonContainerStyle={{
          flex: 1,
          marginLeft: theme.id === DEFAULT_LIGHT_THEME_ID ? -2 : 2,
        }}
        rightContainerStyle={{
          flex: 1,
          alignItems:
            theme.id === DEFAULT_LIGHT_THEME_ID ? 'flex-start' : 'flex-end',
          paddingLeft: 10,
          paddingRight: 10,
          zIndex: 9,
        }}
        containerStyle={{
          width: 80,
          height: 34,
          borderRadius: 15,
        }}
        backgroundColorOn="#fff"
        backgroundColorOff="#fff"
        circleStyle={{
          width: 30,
          height: 30,
          borderRadius: 15,
        }}
        onPress={toggleTheme}
        circleColorOff="#e5e1e0"
        circleColorOn="#e5e1e0"
        duration={100}
      />
    </Row>
  );
});
