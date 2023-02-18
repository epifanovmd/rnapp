import {ScreenName} from '../navigation.types';
import {useTranslation} from '../../localization';

export const useTranslateScreenName = (name: ScreenName) => {
  const {t} = useTranslation();

  return t(`navigation.${name}` as any) as any;
};
