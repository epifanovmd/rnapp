import { FlexProps, useFlexProps } from "@components";
import { useTheme } from "@core";
import { memo, PropsWithChildren } from "react";
import { SvgProps } from "react-native-svg";

import {
  BackIcon,
  CameraIcon,
  CheckBoldIcon,
  CheckIcon,
  CloseCircleIcon,
  CloseIcon,
  DocumentIcon,
  EyeIcon,
  EyeOffIcon,
  ImageIcon,
  SaveIcon,
  SearchIcon,
} from "./icons";

type TOmitFlexPropsKeys =
  | "height"
  | "opacity"
  | "scale"
  | "translateY"
  | "translateX";
type TIconFlexProps = Omit<FlexProps, TOmitFlexPropsKeys>;

const ICONS_MAP = {
  back: BackIcon,
  camera: CameraIcon,
  check: CheckIcon,
  checkBold: CheckBoldIcon,
  closeCircle: CloseCircleIcon,
  close: CloseIcon,
  document: DocumentIcon,
  eye: EyeIcon,
  eyeOff: EyeOffIcon,
  image: ImageIcon,
  save: SaveIcon,
  search: SearchIcon,
};

export type TIconName = keyof typeof ICONS_MAP;

export interface IIconProps extends TIconFlexProps, SvgProps {
  width?: string | number;
  height?: string | number;
  name: TIconName;
}

export const Icon = memo<PropsWithChildren<IIconProps>>(
  ({
    name,
    height = 24,
    width = 24,
    scale,
    opacity,
    translateY,
    translateX,
    fontSize,
    fontFamily,
    fontStyle,
    fontWeight,
    letterSpacing,
    ...rest
  }) => {
    const { style, ownProps } = useFlexProps(rest);
    const { colors } = useTheme();

    const Component = ICONS_MAP[name];

    if (!Component) {
      return null;
    }

    return (
      <Component
        height={height}
        width={width}
        scale={scale}
        opacity={opacity}
        translateY={translateY}
        translateX={translateX}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fontStyle={fontStyle}
        fontWeight={fontWeight}
        letterSpacing={letterSpacing}
        style={style}
        color={colors.textPrimary}
        {...ownProps}
      />
    );
  },
);
