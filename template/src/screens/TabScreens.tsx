import React, {FC, memo} from 'react';
import {AppNavigation, AppTabScreens, StackProps} from '../navigation';
import {Screen1, Screen2} from './tabs';

interface IProps extends StackProps {}

const TAB_SCREENS: AppTabScreens = {
  Page1: {
    screen: Screen1,
    options: {
      title: 'navigation.Page1',
      tabBarIcon: () => null,
    },
  },
  Page2: {
    screen: Screen2,
    options: {
      title: 'navigation.Page2',
      tabBarIcon: () => null,
    },
  },
};

export const TabScreens: FC<IProps> = memo(() => (
  <AppNavigation routes={TAB_SCREENS} />
));
