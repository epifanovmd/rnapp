import React, {useCallback, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import SplashScreen from 'react-native-splash-screen';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StatusBar, useColorScheme} from 'react-native';
import Config from 'react-native-config';
import {configure} from 'mobx';
import {AppScreens} from './AppScreens';
import {Notification} from './notification';
import {ThemeProvider} from './theme';
import {initLocalization, useTranslation} from './localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {navigationRef} from './navigation';
import {ModalHost} from './components';

configure({enforceActions: 'observed'});

initLocalization({initLang: 'ru'});

const App = (): JSX.Element => {
  const isDarkMode = useColorScheme() === 'dark';
  const {i18n} = useTranslation();

  useEffect(() => {
    AsyncStorage.getItem('i18nextLng').then(async lang => {
      if (lang) {
        await i18n.changeLanguage(lang);
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
            <Notification>
              <NavigationContainer ref={navigationRef} onReady={onReady}>
                <AppScreens />
              </NavigationContainer>
            </Notification>
          </ModalHost>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
};

export default App;
