import { FlexProps, useFlexProps } from "@components";
import { useTheme } from "@core";
import { FC, memo, PropsWithChildren } from "react";
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

export type TIconName =
  | "back"
  | "camera"
  | "check"
  | "checkBold"
  | "closeCircle"
  | "close"
  | "document"
  | "eye"
  | "eyeOff"
  | "image"
  | "save"
  | "search";

const icoMap: Record<TIconName, FC<SvgProps>> = {
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

export interface IIconProps
  extends Omit<
      FlexProps,
      "height" | "opacity" | "scale" | "translateY" | "translateX"
    >,
    SvgProps {
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

    const Component = icoMap[name];

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
