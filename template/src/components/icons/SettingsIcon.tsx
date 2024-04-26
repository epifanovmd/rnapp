import React, {FC} from 'react';
import {useFlexProps} from '@force-dev/react-mobile';
import {useTheme} from '../../theme';
import {FlexSvgProps} from './types';
import Svg, {Path} from 'react-native-svg';

interface IProps extends FlexSvgProps {}

export const SettingsIcon: FC<IProps> = ({
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
      <Path d="M0 0h24v24H0V0z" fill="none" />
      <Path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
    </Svg>
  );
};
