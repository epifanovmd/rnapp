import i18next from 'i18next';
import {initReactI18next} from 'react-i18next';
import {getLocales} from 'react-native-localize';

import {ruLocale} from './locales';
// import { enLocale } from "./locales/en";

export type ILanguageType = 'ru';

export const langResources = {
  ru: {translation: {...ruLocale}},
  // en: { translation: { ...enLocale } },
};

export interface IInitLocalizationParams {
  initLang?: ILanguageType;
  isServer?: boolean;
}

export const initLocalization = ({
  initLang = 'ru',
}: IInitLocalizationParams) => {
  i18next
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      fallbackLng: initLang,
      lng: getLocales()[0].languageCode,
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
