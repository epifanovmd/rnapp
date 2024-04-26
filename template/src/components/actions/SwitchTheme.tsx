import React, {FC, memo, PropsWithChildren} from 'react';
import SwitchToggle from 'react-native-switch-toggle';
import {FlexProps, Row} from '@force-dev/react-mobile';
import {DEFAULT_LIGHT_THEME_ID, useTheme} from '../../theme';

interface IProps extends FlexProps {}

export const SwitchTheme: FC<PropsWithChildren<IProps>> = memo(({...rest}) => {
  const {theme, toggleTheme} = useTheme();

  return (
    <Row {...rest}>
      <SwitchToggle
        switchOn={theme.id === DEFAULT_LIGHT_THEME_ID}
        backTextRight={theme.id === DEFAULT_LIGHT_THEME_ID ? 'Light' : 'Dark'}
        buttonStyle={{
          position: 'absolute',
          zIndex: 10,
          backgroundColor: '#62c28e',
          marginLeft: theme.id === DEFAULT_LIGHT_THEME_ID ? -1 : 1,
        }}
        rightContainerStyle={{
          flex: 1,
          alignItems:
            theme.id === DEFAULT_LIGHT_THEME_ID ? 'flex-start' : 'flex-end',
          zIndex: 9,
          borderRadius: 16,
          paddingHorizontal: 6,
        }}
        textLeftStyle={{
          fontSize: 11,
        }}
        textRightStyle={{
          fontSize: 11,
        }}
        containerStyle={{
          alignItems: 'center',
          width: 50,
          height: 20,
          borderRadius: 15,
        }}
        backgroundColorOn="#fefefe"
        backgroundColorOff="#fefefe"
        circleStyle={{
          width: 18,
          height: 18,
          borderRadius: 16,
        }}
        onPress={toggleTheme}
        circleColorOff="#e5e1e0"
        circleColorOn="#e5e1e0"
        duration={100}
      />
    </Row>
  );
});
