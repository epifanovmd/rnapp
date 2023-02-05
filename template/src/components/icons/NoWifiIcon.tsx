import React, {FC} from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';
import {FlexComponentProps, useFlexProps} from '../elements';

interface IProps extends FlexComponentProps<SvgProps> {}

export const NoWifiIcon: FC<IProps> = props => {
  const {style, ownProps} = useFlexProps(props);

  return (
    <Svg style={style} {...ownProps} width="24" height="24" viewBox="0 0 24 24">
      <Path d="M2.28 3 1 4.27l1.47 1.47c-.43.26-.86.55-1.27.86L3 9c.53-.4 1.08-.75 1.66-1.07l2.23 2.23c-.74.34-1.45.75-2.09 1.24l1.8 2.4a8.89 8.89 0 0 1 2.6-1.33L11.75 15c-1.25.07-2.41.5-3.35 1.2L12 21l2.46-3.27L17.74 21 19 19.72M12 3c-2.15 0-4.2.38-6.1 1.07l2.39 2.4A14.87 14.87 0 0 1 21 9l1.8-2.4A17.9 17.9 0 0 0 12 3m0 6c-.38 0-.75 0-1.12.05l3.19 3.2c1.22.28 2.36.82 3.33 1.55l1.8-2.4C17.2 9.89 14.7 9 12 9Z" />
    </Svg>
  );
};
