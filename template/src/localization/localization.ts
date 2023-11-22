import i18next from 'i18next';
import {initReactI18next} from 'react-i18next';
import {getLocales} from 'react-native-localize';
import 'moment/locale/ru';

import {ruLocale, enLocale} from './locales';
import moment from 'moment';

export type ILanguageType = 'ru' | 'en';

export const langResources = {
  ru: {translation: {...ruLocale}},
  en: {translation: {...enLocale}},
};

export interface IInitLocalizationParams {
  initLang?: ILanguageType;
  isServer?: boolean;
}

export const initLocalization = ({
  initLang = 'ru',
}: IInitLocalizationParams) => {
  const defaultLocale = getLocales()[0].languageCode;

  moment.locale(defaultLocale);
  i18next
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      fallbackLng: initLang,
      lng: defaultLocale,
      debug: false,
      load: 'languageOnly',
      interpolation: {
        escapeValue: false,
        prefix: '',
      },
      resources: langResources,
    })
    .then();
};

export const i18n = i18next;
