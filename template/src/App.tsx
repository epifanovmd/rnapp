import React, {useCallback, useEffect} from 'react';
import SplashScreen from 'react-native-splash-screen';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StatusBar, Text, useColorScheme, View} from 'react-native';
import {ModalHost, NotificationProvider} from '@force-dev/react-mobile';
import Config from 'react-native-config';
import {configure} from 'mobx';
import {AppNavigator} from './AppNavigator';
import {ThemeProvider} from './theme';
import {initLocalization, useTranslation} from './localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {navigationRef} from './navigation';

configure({enforceActions: 'observed'});

initLocalization({initLang: 'ru'});

const App = (): JSX.Element => {
  const isDarkMode = useColorScheme() === 'dark';
  const {changeLanguage} = useTranslation();

  useEffect(() => {
    AsyncStorage.getItem('i18nextLng').then(async lang => {
      if (lang) {
        await changeLanguage(lang);
      }
    });
    console.log('CONFIG', JSON.stringify(Config));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onReady = useCallback(() => {
    SplashScreen.hide();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ThemeProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <SafeAreaProvider>
          <ModalHost>
            <NotificationProvider
              placement={'top'}
              offset={0}
              style={{
                maxWidth: '100%',
                width: '100%',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
              }}
              safeArea={true}
              offsetTop={0}
              offsetBottom={0}
              renderType={{
                custom_toast: toast => (
                  <View
                    style={{
                      maxWidth: '100%',
                      paddingHorizontal: 60,
                      paddingVertical: 10,
                      backgroundColor: '#fff',
                      marginVertical: 4,
                      borderRadius: 8,
                      borderLeftColor: '#00C851',
                      borderLeftWidth: 6,
                      justifyContent: 'center',
                      paddingLeft: 16,
                    }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: '#333',
                        fontWeight: 'bold',
                      }}>
                      {toast.data.title}
                    </Text>
                    <Text style={{color: '#a3a3a3', marginTop: 2}}>
                      {toast.message}
                    </Text>
                  </View>
                ),
              }}>
              <AppNavigator ref={navigationRef} onReady={onReady} />
            </NotificationProvider>
          </ModalHost>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
};

export default App;
