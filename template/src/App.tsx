import React, {useCallback, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import SplashScreen from 'react-native-splash-screen';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StatusBar, useColorScheme} from 'react-native';
import Config from 'react-native-config';
import {AppScreens} from './AppScreens';
import {Notification} from './components/notification';
import {ThemeProvider} from './theme';

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    setTimeout(() => {
      console.log('CONFIG', JSON.stringify(Config));
    }, 1000);
  }, []);

  const onReady = useCallback(() => {
    SplashScreen.hide();
  }, []);

  return (
    <ThemeProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaProvider>
        <Notification>
          <NavigationContainer onStateChange={onReady} onReady={onReady}>
            <AppScreens />
          </NavigationContainer>
        </Notification>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default App;
