import {FlexComponentProps} from '../elements';
import {SvgProps} from 'react-native-svg';

export type FlexSvgProps = FlexComponentProps<
  Omit<SvgProps, 'fontStyle' | 'fontWeight'>
>;
