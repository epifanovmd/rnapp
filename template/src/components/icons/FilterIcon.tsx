import React, {FC} from 'react';
import Svg, {G, Path} from 'react-native-svg';
import {useFlexProps} from '../elements';
import {FlexSvgProps} from './types';

interface IProps extends FlexSvgProps {}

export const FilterIcon: FC<IProps> = props => {
  const {style, ownProps} = useFlexProps(props);

  return (
    <Svg
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      style={style}
      {...ownProps}>
      <G fill="none" fill-rule="nonzero">
        <Path
          fill="#1C4598"
          fillRule="nonzero"
          d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"
        />
        <Path d="M0 0h24v24H0z" />
      </G>
    </Svg>
  );
};
