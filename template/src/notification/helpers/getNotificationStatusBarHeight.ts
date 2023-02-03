import {getStatusBarHeight, isAndroid, isIPad, isIPhoneX} from '../../common';

export const getNotificationStatusBarHeight = (
  isLandscape: boolean = false,
) => {
  if (isAndroid) {
    return 6;
  }

  if (isIPhoneX) {
    return isLandscape ? 0 : getStatusBarHeight(true);
  }

  if (isIPad) {
    return 20;
  }

  return isLandscape ? 0 : 20;
};
