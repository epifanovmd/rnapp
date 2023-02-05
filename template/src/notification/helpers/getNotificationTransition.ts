import {Animated, Platform, TranslateYTransform} from 'react-native';
import {NotificationPosition} from '../notification.types';

const OFFSET_HEIGHT = Platform.OS !== 'ios' ? 60 : 48;

export type Transition =
  | {
      transform: TranslateYTransform[];
      opacity: number;
    }
  | {opacity: number}
  | {};

export const getNotificationTransition = (
  animValue: Animated.Value,
  position: NotificationPosition = 'top',
): Transition => {
  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (position === 'top') {
    const translateY = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-OFFSET_HEIGHT, 0],
    });

    return {
      transform: [{translateY}],
      opacity,
    };
  } else if (position === 'bottom') {
    const translateY = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [OFFSET_HEIGHT, 0],
    });

    return {
      transform: [{translateY}],
      opacity,
    };
  }

  return {
    opacity,
  };
};
