import React, {FC, memo} from 'react';
import {AppNavigation, AppTabScreens, StackProps} from '../navigation';
import {Screen1} from './screen1';
import {Screen2} from './screen2';

interface IProps extends StackProps {}

const TAB_SCREENS: AppTabScreens = {
  Page1: {
    screen: Screen1,
    options: {
      title: 'navigation.page1',
      tabBarIcon: () => null,
    },
  },
  Page2: {
    screen: Screen2,
    options: {
      title: 'navigation.page2',
      tabBarIcon: () => null,
    },
  },
};

export const TabScreens: FC<IProps> = memo(() => (
  <AppNavigation routes={TAB_SCREENS} />
));
