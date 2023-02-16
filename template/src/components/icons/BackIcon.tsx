import React, {FC} from 'react';
import Svg, {G, Path} from 'react-native-svg';
import {useFlexProps} from '../elements';
import {FlexSvgProps} from './types';

interface IProps extends FlexSvgProps {}

export const BackIcon: FC<IProps> = props => {
  const {style, ownProps} = useFlexProps(props);

  return (
    <Svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      style={style}
      {...ownProps}>
      <G fill="none" fillRule="evenodd">
        <Path d="M0 0h24v24H0z" />
        <Path
          fill="#1C4598"
          fillRule="nonzero"
          d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z"
        />
      </G>
    </Svg>
  );
};
