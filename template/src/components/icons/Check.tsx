import {useFlexProps} from '@force-dev/react-mobile';
import React, {FC} from 'react';
import Svg, {Path} from 'react-native-svg';
import {useTheme} from '../../theme';
import {FlexSvgProps} from './types';

export const CheckIcon: FC<FlexSvgProps> = ({
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
      <Path d="M21 6.99984L9 18.9998L3.5 13.4998L4.91 12.0898L9 16.1698L19.59 5.58984L21 6.99984Z" />
    </Svg>
  );
};
