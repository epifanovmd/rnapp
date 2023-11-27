import * as React from 'react';
import {
  Animated,
  ColorValue,
  FlexAlignType,
  ImageStyle,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import AnimatedProps = Animated.AnimatedProps;
import WithAnimatedValue = Animated.WithAnimatedValue;

export type NumericSpacesType =
  | 2
  | 4
  | 6
  | 8
  | 10
  | 12
  | 14
  | 16
  | 18
  | 20
  | 22
  | 24
  | 26
  | 28
  | 30
  | 32
  | 36
  | 38
  | 40
  | 44
  | number;

export type JustifyContentType =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';
export type AlignSelfType = 'auto' | FlexAlignType;
export type FlexWrapType = 'wrap' | 'nowrap' | 'wrap-reverse';
export type AlignContentType =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'stretch'
  | 'space-between'
  | 'space-around';

interface PaddingProps {
  paddingLeft?: number | string;
  paddingRight?: number | string;
  paddingTop?: number | string;
  paddingBottom?: number | string;
  paddingVertical?: number | string;
  paddingHorizontal?: number | string;
  padding?: number | string;
  paddingStart?: number | string;
  paddingEnd?: number | string;
}

interface MarginProps {
  marginLeft?: number | string;
  marginRight?: number | string;
  marginTop?: number | string;
  marginBottom?: number | string;
  marginVertical?: number | string;
  marginHorizontal?: number | string;
  margin?: number | string;
}

interface PaddingGridProps {
  // paddingLeft
  pl?: NumericSpacesType;
  // paddingRight
  pr?: NumericSpacesType;
  // paddingTop
  pt?: NumericSpacesType;
  // paddingBottom
  pb?: NumericSpacesType;
  // paddingVertical
  pv?: NumericSpacesType;
  // paddingHorizontal
  ph?: NumericSpacesType;
  // padding
  pa?: NumericSpacesType;
}

interface MargingGridProps {
  // marginLeft
  ml?: NumericSpacesType;
  // marginRight
  mr?: NumericSpacesType;
  // marginTop
  mt?: NumericSpacesType;
  // marginBottom
  mb?: NumericSpacesType;
  // marginVertical
  mv?: NumericSpacesType;
  // marginHorizontal
  mh?: NumericSpacesType;
  // margin
  ma?: NumericSpacesType;
}

interface SideProps {
  // Более короткая запись <Col left/>, вместо <Col left={0}/>
  left?: number | string | true;
  // Более короткая запись <Col right/>, вместо <Col right={0}/>
  right?: number | string | true;
  // Более короткая запись <Col top/>, вместо <Col top={0}/>
  top?: number | string | true;
  // Более короткая запись <Col bottom/>, вместо <Col bottom={0}/>
  bottom?: number | string | true;
}

interface SizeProps {
  // Более короткая запись <Row height/>, вместо <Row height={'100%'}/>
  height?: number | string | true;
  minHeight?: number | string;
  maxHeight?: number | string;
  // Более короткая запись <Col width/>, вместо <Col width={'100%'}/>
  width?: number | string | true;
  minWidth?: number | string;
  maxWidth?: number | string;
}

interface FlexLayoutProps {
  // Более короткая запись <Col flex/>, вместо <Col flex={1}/>
  flex?: number | true;
  // Более короткая запись <Col flexGrow/>, вместо <Col flexGrow={1}/>
  flexGrow?: number | true;
  flexBasis?: number | string;
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  // Более короткая запись <Col flexShrink/>, вместо <Col flexShrink={1}/>
  flexShrink?: number | true;
}

interface FlexDirectionProps {
  // flexDirection: 'row'
  row?: true;
  // flexDirection: 'column'
  col?: true;
  wrap?: FlexWrapType | true;
}

interface AlignProps {
  alignItems?: FlexAlignType;
  alignSelf?: AlignSelfType;
  justifyContent?: JustifyContentType;
  centerContent?: true;
  alignContent?: AlignContentType;
}

interface PositionProps {
  // position='absolute'
  absolute?: true;
  absoluteFill?: true;
  zIndex?: number;
}

interface BorderProps {
  // borderRadius
  radius?: WithAnimatedValue<number>;
  topRadius?: WithAnimatedValue<number>;
  bottomRadius?: WithAnimatedValue<number>;
  leftRadius?: WithAnimatedValue<number>;
  rightRadius?: WithAnimatedValue<number>;
  // circle - диаметр круга
  circle?: number;
  overflow?: 'visible' | 'hidden' | 'scroll';
  borderColor?: WithAnimatedValue<string>;
  borderWidth?: WithAnimatedValue<number>;
  borderBottomWidth?: WithAnimatedValue<number>;
  borderTopWidth?: WithAnimatedValue<number>;
  borderLeftWidth?: WithAnimatedValue<number>;
  borderRightWidth?: WithAnimatedValue<number>;
}

interface TransformProps {
  rotate?: string;
  translateX?: number;
  translateY?: number;
  scale?: number;
}

interface ShadowProps {
  elevation?: number;
}

interface DebugProps {
  // true - красит фон красным, 'любой текст' - выведет указанный текст в лог из render
  debug?: true | string;
}

interface ColorProps {
  bg?: string;
  opacity?: number | string;
}

interface TextProps {
  color?: ColorValue | Animated.Animated;
  fontFamily?: string;
  fontSize?: number | Animated.Animated;
  fontStyle?: 'normal' | 'italic';
  fontWeight?:
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';
  letterSpacing?: number | Animated.Animated;
  lineHeight?: number | Animated.Animated;
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  textDecorationLine?:
    | 'none'
    | 'underline'
    | 'line-through'
    | 'underline line-through';
  textDecorationStyle?: 'solid' | 'double' | 'dotted' | 'dashed';
  textDecorationColor?: ColorValue | Animated.Animated;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
}

type CommonFlexProps = AnimatedProps<PaddingGridProps> &
  AnimatedProps<MargingGridProps> &
  AnimatedProps<SideProps> &
  AnimatedProps<SizeProps> &
  AnimatedProps<PaddingProps> &
  AnimatedProps<MarginProps> &
  FlexLayoutProps &
  FlexDirectionProps &
  AlignProps &
  PositionProps &
  DebugProps &
  ShadowProps &
  BorderProps &
  AnimatedProps<TransformProps> &
  AnimatedProps<ColorProps>;

export type FlexStyle = ViewStyle & TextStyle;

export type FlexProps<
  TStyleSource extends ViewStyle | TextStyle | ImageStyle = ViewStyle,
> = (Omit<TextStyle, keyof ViewStyle> extends TStyleSource
  ? CommonFlexProps & TextProps
  : CommonFlexProps) & {
  animated?: true;
  style?: StyleProp<TStyleSource>;
};

export type FlexComponentProps<
  TProps = {},
  TStyleSource extends ViewStyle | TextStyle | ImageStyle = ViewStyle,
> = Omit<TProps, 'style'> &
  FlexProps<TStyleSource> & {children?: React.ReactNode};
