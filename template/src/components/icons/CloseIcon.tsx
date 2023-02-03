import React, {FC} from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';
import {FlexComponentProps, useFlexProps} from '../elements';

interface IProps extends FlexComponentProps<SvgProps> {}

export const CloseIcon: FC<IProps> = props => {
  const {style, ownProps} = useFlexProps(props);

  return (
    <Svg style={style} {...ownProps} width="24" height="24" viewBox="0 0 24 24">
      <Path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z" />
    </Svg>
  );
};
