import * as React from 'react';
import {
  Animated,
  ColorValue,
  FlexAlignType,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import AnimatedProps = Animated.AnimatedProps;

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
  // ?????????? ???????????????? ???????????? <Col left/>, ???????????? <Col left={0}/>
  left?: number | string | true;
  // ?????????? ???????????????? ???????????? <Col right/>, ???????????? <Col right={0}/>
  right?: number | string | true;
  // ?????????? ???????????????? ???????????? <Col top/>, ???????????? <Col top={0}/>
  top?: number | string | true;
  // ?????????? ???????????????? ???????????? <Col bottom/>, ???????????? <Col bottom={0}/>
  bottom?: number | string | true;
}

interface SizeProps {
  // ?????????? ???????????????? ???????????? <Row height/>, ???????????? <Row height={'100%'}/>
  height?: number | string | true;
  minHeight?: number | string;
  maxHeight?: number | string;
  // ?????????? ???????????????? ???????????? <Col width/>, ???????????? <Col width={'100%'}/>
  width?: number | string | true;
  minWidth?: number | string;
  maxWidth?: number | string;
}

interface FlexLayoutProps {
  // ?????????? ???????????????? ???????????? <Col flex/>, ???????????? <Col flex={1}/>
  flex?: number | true;
  // ?????????? ???????????????? ???????????? <Col flexGrow/>, ???????????? <Col flexGrow={1}/>
  flexGrow?: number | true;
  flexBasis?: number | string;
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  // ?????????? ???????????????? ???????????? <Col flexShrink/>, ???????????? <Col flexShrink={1}/>
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
  radius?: number | Animated.Animated;
  topRadius?: number | Animated.Animated;
  bottomRadius?: number | Animated.Animated;
  leftRadius?: number | Animated.Animated;
  rightRadius?: number | Animated.Animated;
  // circle - ?????????????? ??????????
  circle?: number;
  overflow?: 'visible' | 'hidden' | 'scroll';
  borderColor?: string | Animated.Animated;
  borderWidth?: number | Animated.Animated;
  borderBottomWidth?: number | Animated.Animated;
  borderTopWidth?: number | Animated.Animated;
  borderLeftWidth?: number | Animated.Animated;
  borderRightWidth?: number | Animated.Animated;
}

interface TransformProps {
  animated?: true;
  /**
   * Value for: transform: [{rotate: string}]
   * Examples: '90deg', '0.785398rad'
   */
  rotate?: string | Animated.Animated;
  translateX?: number | Animated.Animated;
  translateY?: number | Animated.Animated;
  scale?: number | Animated.Animated;
}

interface ShadowProps {
  elevation?: number;
}

interface DebugProps {
  // true - ???????????? ?????? ??????????????, '?????????? ??????????' - ?????????????? ?????????????????? ?????????? ?? ?????? ???? render
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
  TransformProps &
  AnimatedProps<ColorProps>;

export type FlexStyle = ViewStyle & TextStyle;

export type FlexProps<TStyleSource = ViewStyle> = (Omit<
  TextStyle,
  keyof ViewStyle
> extends TStyleSource
  ? CommonFlexProps & TextProps
  : CommonFlexProps) &
  AnimatedProps<{
    readonly style?: StyleProp<TStyleSource>;
  }>;

export type FlexComponentProps<TProps = {}, TStyleSource = ViewStyle> = Omit<
  TProps,
  'style'
> &
  FlexProps<TStyleSource> & {children?: React.ReactNode};
