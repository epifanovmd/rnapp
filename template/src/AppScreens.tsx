import React, {FC, memo} from 'react';
import {StackNavigation, StackScreens} from './navigation';
import {OtherFirstScreen, OtherSecondScreen} from './components';
import {TabScreens} from './screens';

interface IProps {}

export const SCREENS: StackScreens = {
  MAIN: {screen: TabScreens},

  OtherFirstScreen: {screen: OtherFirstScreen},
  OtherSecondScreen: {screen: OtherSecondScreen},
};

export const AppScreens: FC<IProps> = memo(() => (
  <StackNavigation
    routes={SCREENS}
    initialRouteName={'Page1'}
    screenOptions={{animationEnabled: false}}
  />
));
