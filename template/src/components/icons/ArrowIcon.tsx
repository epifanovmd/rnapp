import React, {FC} from 'react';
import Svg, {G, Path} from 'react-native-svg';
import {useFlexProps} from '@force-dev/react-mobile';
import {useTheme} from '../../theme';
import {FlexSvgProps} from './types';

interface IProps extends FlexSvgProps {}

export const ArrowIcon: FC<IProps> = ({
  height = 24,
  width = 24,
  scale,
  opacity,
  translateY,
  translateX,
  color,
  fontSize,
  fontFamily,
  fontStyle,
  fontWeight,
  letterSpacing,
  ...rest
}) => {
  const {style, ownProps} = useFlexProps(rest);
  const {
    theme: {
      color: {text},
    },
  } = useTheme();

  return (
    <Svg
      viewBox="0 0 24 24"
      height={height}
      width={width}
      scale={scale}
      opacity={opacity}
      translateY={translateY}
      translateX={translateX}
      color={color}
      fontSize={fontSize}
      fontFamily={fontFamily}
      fontStyle={fontStyle}
      fontWeight={fontWeight}
      letterSpacing={letterSpacing}
      style={style}
      {...ownProps}
      fill={ownProps?.fill || color || text}>
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
