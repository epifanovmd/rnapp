import {ScreenName} from '../../navigation';

export type Locale = {
  navigation: Partial<{
    [key in ScreenName]: string;
  }>;
  [key: string]: string | object;
};
