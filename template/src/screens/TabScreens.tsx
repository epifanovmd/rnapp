import React, {FC, memo, useMemo} from 'react';
import {Text} from '../components';
import {useTranslation} from '../localization';
import {
  AppNavigation,
  AppTabScreens,
  ScreenName,
  StackProps,
} from '../navigation';
import {Playground, Users} from './tabs';

interface IProps extends StackProps {}

export const TAB_SCREENS: AppTabScreens = {
  Playground: {
    screen: Playground,
    options: {
      title: 'navigation.Playground',
      tabBarIcon: () => <Text>{'PG'}</Text>,
    },
  },
  Users: {
    screen: Users,
    options: {
      title: 'navigation.Users',
      tabBarIcon: () => <Text>{'US'}</Text>,
    },
  },
};

export const TabScreens: FC<IProps> = memo(() => {
  const {t} = useTranslation();

  const tabs = useMemo(
    () =>
      Object.keys(TAB_SCREENS).reduce<any>((acc, key) => {
        const item = TAB_SCREENS[key as ScreenName];

        acc[key] = {
          ...item,
          options: {
            ...item?.options,
            title: t(item?.options?.title as any),
          },
        } as any;

        return acc;
      }, {}),
    [t],
  );

  return <AppNavigation routes={tabs} />;
});
