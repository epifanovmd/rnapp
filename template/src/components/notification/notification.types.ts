import {ViewProps} from 'react-native';

export type NotificationPosition = 'top' | 'bottom' | 'center';

export interface NotificationOptions extends ViewProps {
  animated?: boolean;
  animationDuration?: number;
  backgroundColor?: string;
  autoHide?: boolean;
  color?: string;
  duration?: number;
  floating?: boolean;
  hideOnPress?: boolean;
  position?: NotificationPosition;
}
