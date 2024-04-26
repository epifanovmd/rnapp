import {observer} from 'mobx-react-lite';
import React, {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import SplashScreen from 'react-native-splash-screen';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {StatusBar, StyleSheet, Text, useColorScheme, View} from 'react-native';
import {
  ModalHost,
  NotificationProvider,
  NotificationToastProps,
} from '@force-dev/react-mobile';
import Config from 'react-native-config';
import {configure} from 'mobx';
import {AppNavigator} from './AppNavigator';
import {AttachModalProvider} from './components';
import {log} from './service';
import {ThemeProvider} from './theme';
import {initLocalization, useTranslation} from './localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {navigationRef} from './navigation';

configure({enforceActions: 'observed'});

initLocalization({initLang: 'ru'});

const App: FC = observer(() => {
  const isDarkMode = useColorScheme() === 'dark';
  const {changeLanguage} = useTranslation();

  useEffect(() => {
    AsyncStorage.getItem('i18nextLng').then(async lang => {
      if (lang) {
        await changeLanguage(lang);
      }
    });
    log.debug('CONFIG', JSON.stringify(Config));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onReady = useCallback(() => {
    SplashScreen.hide();
  }, []);

  return (
    <GestureHandlerRootView style={ss.container}>
      <ThemeProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <SafeAreaProvider>
          <ModalHost>
            <AttachModalProvider>
              <_Notifications>
                <AppNavigator ref={navigationRef} onReady={onReady} />
              </_Notifications>
            </AttachModalProvider>
          </ModalHost>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
});

const ss = StyleSheet.create({
  container: {
    flex: 1,
  },
  notificationProvider: {
    maxWidth: '100%',
    width: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  customToast: {
    maxWidth: '100%',
    paddingHorizontal: 60,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftColor: '#00C851',
    borderLeftWidth: 6,
    justifyContent: 'center',
    paddingLeft: 16,
  },
  customToastTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  customToastText: {color: '#a3a3a3', marginTop: 2},
});

const _Notifications: FC<PropsWithChildren> = ({children}) => {
  const {top} = useSafeAreaInsets();
  const renderType = useMemo(
    () => ({
      custom_toast: (toast: NotificationToastProps) => (
        <View style={[ss.customToast, {marginTop: top}]}>
          <Text style={ss.customToastTitle}>{toast.data?.title}</Text>
          <Text style={ss.customToastText}>{toast.message}</Text>
        </View>
      ),
    }),
    [top],
  );

  return (
    <NotificationProvider
      style={ss.notificationProvider}
      // onPress={() => {
      //   console.log('press');
      // }}
      // onClose={() => {
      //   console.log('onClose');
      // }}
      renderType={renderType}>
      {children}
    </NotificationProvider>
  );
};

export default App;
