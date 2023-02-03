import {useNavigation as _useNavigation} from '@react-navigation/native';
import {NavigationProp} from '@react-navigation/core/lib/typescript/src/types';
import {ScreenParamsTypes} from '../navigation.types';

export const useNavigation = () =>
  _useNavigation<NavigationProp<ScreenParamsTypes>>();
