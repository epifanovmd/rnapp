import {Platform} from 'react-native';

export function shadowStyle(elevation: number): any {
  return Platform.select({
    ios: {
      shadowRadius: elevation * 2,
      shadowOffset: {
        height: 0,
        width: 0,
      },
      shadowColor: elevation === 0 ? 'transparent' : 'black',
      shadowOpacity: elevation || 0.14,
    },
    android: {elevation},
  });
}
