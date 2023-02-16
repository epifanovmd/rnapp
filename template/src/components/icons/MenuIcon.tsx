import React, {FC} from 'react';
import Svg, {G, Path} from 'react-native-svg';
import {useFlexProps} from '../elements';
import {FlexSvgProps} from './types';

interface IProps extends FlexSvgProps {}

export const MenuIcon: FC<IProps> = props => {
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
          fill="#000"
          fillRule="nonzero"
          d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
        />
      </G>
    </Svg>
  );
};
