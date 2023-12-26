import React, {forwardRef, memo, useMemo} from 'react';
import {
  ScreenParamList,
  StackNavigation,
  StackScreenOption,
  StackScreens,
} from './navigation';
import {OtherFirstScreen, OtherSecondScreen, TabScreens} from './screens';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import {useTheme} from './theme';
import {CardStyleInterpolators} from '@react-navigation/stack';

interface IProps {
  onReady?: () => void;
}

export const SCREENS: StackScreens = {
  MAIN: {screen: TabScreens},

  OtherFirstScreen: {screen: OtherFirstScreen},
  OtherSecondScreen: {screen: OtherSecondScreen},
};

const options: StackScreenOption = {
  animationEnabled: true,
  gestureEnabled: true,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

export const AppNavigator = memo(
  forwardRef<NavigationContainerRef<ScreenParamList>, IProps>(
    ({onReady}, ref) => {
      const {theme} = useTheme();

      const navigatorTheme = useMemo(() => {
        return {
          dark: true,
          colors: {
            background: theme.color.background,
            text: theme.color.common.white,
            notification: 'red',
            card: theme.color.grey.grey700,
            border: theme.color.grey.grey700,
            primary: theme.color.common.white,
          },
        };
      }, [
        theme.color.background,
        theme.color.common.white,
        theme.color.grey.grey700,
      ]);

      return (
        <NavigationContainer ref={ref} onReady={onReady} theme={navigatorTheme}>
          <StackNavigation
            routes={SCREENS}
            // initialRouteName={'ScreenPlayground'}
            screenOptions={options}
          />
        </NavigationContainer>
      );
    },
  ),
);
