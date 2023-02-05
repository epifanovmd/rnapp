import {useTranslation as useT} from 'react-i18next';
import {i18n} from 'i18next';
import {ruLocale} from '../locales';
import {RecursiveObjectType} from '@force-dev/utils';

export type II18nPaths = RecursiveObjectType<typeof ruLocale>;

export const useTranslation: () => {
  t: (path: II18nPaths, options?: object) => string;
  i18n: i18n;
} = useT;
