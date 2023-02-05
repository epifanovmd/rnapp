import {useRoute as _useRoute} from '@react-navigation/native';
import {RouteProp} from '@react-navigation/core/lib/typescript/src/types';
import {ScreenParamsTypes} from '../navigation.types';

export const useRoute = () => _useRoute<RouteProp<ScreenParamsTypes>>();
