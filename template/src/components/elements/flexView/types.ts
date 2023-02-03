import * as React from 'react';
import {
  Animated,
  ColorValue,
  FlexAlignType,
  StyleProp,
  ViewProps,
  ViewStyle,
} from 'react-native';

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
  // flexDirection: 'row' (row-reverse)
  row?: boolean;
  // flexDirection: 'column' (column-reverse)
  col?: boolean;
  // flexDirection: row-reverse || column-reverse
  reverse?: boolean;
  wrap?: FlexWrapType | true;
}

interface AlignProps {
  alignItems?: FlexAlignType;
  alignSelf?: AlignSelfType;
  justifyContent?: JustifyContentType;
  centerContent?: boolean;
  alignContent?: AlignContentType;
}

interface PositionProps {
  // position='absolute'
  absolute?: boolean;
  absoluteFill?: boolean;
  zIndex?: number;
}

interface BorderProps {
  // borderRadius
  radius?: number;
  topRadius?: number;
  bottomRadius?: number;
  leftRadius?: number;
  rightRadius?: number;
  // circle - диаметр круга
  circle?: number;
  overflow?: 'visible' | 'hidden' | 'scroll' | boolean;
  borderColor?: string;
  borderWidth?: number;
  borderBottomWidth?: number;
  borderTopWidth?: number;
}

interface TransformProps {
  animated?: boolean;
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
  // true - красит фон красным, 'любой текст' - выведет указанный текст в лог из render
  debug?: boolean | string;
}

interface ColorProps {
  bg?: string;
  opacity?: number | string | Animated.Animated;
}

interface TextProps {
  color?: ColorValue;
  fontFamily?: string;
  fontSize?: number;
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
  letterSpacing?: number;
  lineHeight?: number;
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  textDecorationLine?:
    | 'none'
    | 'underline'
    | 'line-through'
    | 'underline line-through';
  textDecorationStyle?: 'solid' | 'double' | 'dotted' | 'dashed';
  textDecorationColor?: ColorValue;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
}

export interface FlexProps<TStyleSource = ViewStyle>
  extends PaddingGridProps,
    MargingGridProps,
    SideProps,
    SizeProps,
    PaddingProps,
    MarginProps,
    FlexLayoutProps,
    FlexDirectionProps,
    AlignProps,
    PositionProps,
    DebugProps,
    ShadowProps,
    BorderProps,
    TransformProps,
    ColorProps,
    TextProps {
  style?: StyleProp<TStyleSource>;
}

export type FlexComponentProps<
  TProps = ViewProps,
  TStyleSource = ViewStyle,
> = FlexProps<TStyleSource> & TProps & {children?: React.ReactNode};
