import React, {FC} from 'react';
import Svg, {G, Path, Polygon} from 'react-native-svg';
import {useFlexProps} from '../elements';
import {FlexSvgProps} from './types';

interface IProps extends FlexSvgProps {}

export const SearchIcon: FC<IProps> = props => {
  const {style, ownProps} = useFlexProps(props);

  return (
    <Svg viewBox="0 0 20 20" style={style} {...ownProps}>
      <G
        id="02-Events"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd">
        <G id="02.01_1920" transform="translate(-295.000000, -1133.000000)">
          <G id="ic_search_24px" transform="translate(292.000000, 1130.000000)">
            <Path
              d="M15.5,14 L14.71,14 L14.43,13.73 C15.41,12.59 16,11.11 16,9.5 C16,5.91 13.09,3 9.5,3 C5.91,3 3,5.91 3,9.5 C3,13.09 5.91,16 9.5,16 C11.11,16 12.59,15.41 13.73,14.43 L14,14.71 L14,15.5 L19,20.49 L20.49,19 L15.5,14 Z M9.5,14 C7.01,14 5,11.99 5,9.5 C5,7.01 7.01,5 9.5,5 C11.99,5 14,7.01 14,9.5 C14,11.99 11.99,14 9.5,14 Z"
              id="Shape"
              fill={props.fill}
              fillRule="nonzero"
            />
            <Polygon id="Shape" points="0 0 24 0 24 24 0 24" />
          </G>
        </G>
      </G>
    </Svg>
  );
};
