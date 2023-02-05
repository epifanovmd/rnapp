import {StyleSheet} from 'react-native';
import {NotificationPosition} from '../notification.types';

export function getNotificationPositionStyle(
  position: NotificationPosition = 'top',
) {
  return [
    styles.root,
    position === 'top' && styles.rootTop,
    position === 'bottom' && styles.rootBottom,
    position === 'center' && styles.rootCenter,
  ];
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
  },
  rootTop: {
    top: 0,
  },
  rootBottom: {
    bottom: 0,
  },
  rootCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
