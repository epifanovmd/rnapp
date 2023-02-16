import React, {FC} from 'react';
import Svg, {G, Path} from 'react-native-svg';
import {useFlexProps} from '../elements';
import {FlexSvgProps} from './types';

interface IProps extends FlexSvgProps {}

export const ArrowIcon: FC<IProps> = props => {
  const {style, ownProps} = useFlexProps(props);

  return (
    <Svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      style={style}
      {...ownProps}>
      <G fill="none" fillRule="evenodd">
        <Path
          fill="#000"
          fillRule="nonzero"
          d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"
        />
        <Path d="M0 0v24h24V0z" />
      </G>
    </Svg>
  );
};
