import {useCallback} from 'react';
import {II18nPaths, useTranslation} from '../../localization';

export const useTransformScreenOptions = <Options>(): ((
  options: Options,
) => Options) => {
  const {t} = useTranslation();

  return useCallback(
    (options: Options) => {
      if ((options as any) && (options as any).title) {
        (options as any).title = t((options as any).title as II18nPaths);
      }

      return options as Options;
    },

    [t],
  );
};
