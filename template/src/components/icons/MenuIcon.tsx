import React, {FC} from 'react';
import Svg, {G, Path} from 'react-native-svg';
import {useFlexProps} from '@force-dev/react-mobile';
import {useTheme} from '../../theme';
import {FlexSvgProps} from './types';

interface IProps extends FlexSvgProps {}

export const MenuIcon: FC<IProps> = ({
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
        <Path d="M0 0h24v24H0z" />
        <Path
          fill={ownProps.fill}
          fillRule="nonzero"
          d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
        />
      </G>
    </Svg>
  );
};
