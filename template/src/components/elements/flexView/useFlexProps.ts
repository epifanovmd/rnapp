import {StyleSheet, TextStyle, ViewStyle} from 'react-native';
import {FlexProps} from './types';
import {shadowStyle} from './shadowStyle';
import {useMemo} from 'react';

export type Writable<T> = {
  -readonly [K in keyof T]: T[K];
};

export const useFlexProps = <
  TProps extends FlexProps,
  TOwnProps = Omit<TProps, keyof FlexProps>,
  TStyleSource = ViewStyle,
>(
  props: TProps,
  defaultProps?: Partial<TProps>,
) =>
  useMemo(() => {
    const styleProps = defaultProps || ({} as FlexProps);
    const ownProps = {} as TOwnProps;
    const styleSource = {} as any as TStyleSource;

    viewStylePropsConverter(
      {...defaultProps, ...props},
      styleProps,
      ownProps,
      styleSource,
    );
    const style = StyleSheet.create({style: styleSource});

    if (typeof props.debug === 'string') {
      console.log(`FlexView::render ${props.debug}`); // 🐞 ✅
    }

    return {
      styleSource,
      styleProps,
      ownProps,
      style: style.style,
      animated: styleProps.animated,
    };
    // eslint-disable-next-line
  }, [props]);

type All<T1, T2> = T1 & T2;

/**
 * Идея в том, чтобы максимпльно эффективно выполнить такие задачи:
 * - Общий объект props компонента разделить на свойства стилей и собственные свойства компонента
 * - По свойствам стилей сформировать реальный RN объект стиля компонента.
 * @param props На вход подаём свойства компонента, стилевые и собственные со значениями.
 * @param outStyleProps Если задан, в итоге будет содержать все стилевые свойства.
 * @param outOwnProps Если задан, в итоге будет содержать все собственные свойства.
 * @param outStyleSource Если задан, в итоге будет содержать объект со свойствами реального RN стиля компонента.
 */
function viewStylePropsConverter<
  TProps extends TStyleProps,
  TStyleProps extends object & FlexProps,
  TOwnProps = Omit<TProps, keyof TStyleProps>,
  TStyleSource extends All<TextStyle, ViewStyle> = All<TextStyle, ViewStyle>,
>(
  props: TProps,
  outStyleProps?: TStyleProps,
  outOwnProps?: TOwnProps,
  outStyleSource?: TStyleSource,
) {
  const sp = outStyleProps as Writable<TStyleProps> | undefined;
  const ss = outStyleSource as Writable<TStyleSource> | undefined;

  for (const key in props) {
    if (props.hasOwnProperty(key)) {
      // Если выполнение зайдёт в каждый switch-default, значит это собственное свойство компонента (не стилевое)
      let isOwnProp = false;
      const v = (props as any)[key] as any;

      switch (key) {
        // paddings
        case 'pa':
          const pa: FlexProps['pa'] = v;

          if (ss && pa !== undefined) {
            ss.padding = pa;
          }
          break;
        case 'ph':
          const ph: FlexProps['ph'] = v;

          if (ss && ph !== undefined) {
            ss.paddingHorizontal = ph;
          }
          break;
        case 'pv':
          const pv: FlexProps['pv'] = v;

          if (ss && pv !== undefined) {
            ss.paddingVertical = pv;
          }
          break;
        case 'pl':
          const pl: FlexProps['pl'] = v;

          if (ss && pl !== undefined) {
            ss.paddingLeft = pl;
          }
          break;
        case 'pr':
          const pr: FlexProps['pr'] = v;

          if (ss && pr !== undefined) {
            ss.paddingRight = pr;
          }
          break;
        case 'pt':
          const pt: FlexProps['pt'] = v;

          if (ss && pt !== undefined) {
            ss.paddingTop = pt;
          }
          break;
        case 'pb':
          const pb: FlexProps['pb'] = v;

          if (ss && pb !== undefined) {
            ss.paddingBottom = pb;
          }
          break;
        case 'paddingLeft':
          const paddingLeft: FlexProps['paddingLeft'] = v;

          if (ss && paddingLeft !== undefined) {
            ss.paddingLeft = paddingLeft;
          }
          break;
        case 'paddingRight':
          const paddingRight: FlexProps['paddingRight'] = v;

          if (ss && paddingRight !== undefined) {
            ss.paddingRight = paddingRight;
          }
          break;
        case 'paddingTop':
          const paddingTop: FlexProps['paddingTop'] = v;

          if (ss && paddingTop !== undefined) {
            ss.paddingTop = paddingTop;
          }
          break;
        case 'paddingBottom':
          const paddingBottom: FlexProps['paddingBottom'] = v;

          if (ss && paddingBottom !== undefined) {
            ss.paddingBottom = paddingBottom;
          }
          break;
        case 'paddingVertical':
          const paddingVertical: FlexProps['paddingVertical'] = v;

          if (ss && paddingVertical !== undefined) {
            ss.paddingVertical = paddingVertical;
          }
          break;
        case 'paddingHorizontal':
          const paddingHorizontal: FlexProps['paddingHorizontal'] = v;

          if (ss && paddingHorizontal !== undefined) {
            ss.paddingHorizontal = paddingHorizontal;
          }
          break;
        case 'padding':
          const padding: FlexProps['padding'] = v;

          if (ss && padding !== undefined) {
            ss.padding = padding;
          }
          break;
        case 'paddingStart':
          const paddingStart: FlexProps['paddingStart'] = v;

          if (ss && paddingStart !== undefined) {
            ss.paddingStart = paddingStart;
          }
          break;
        case 'paddingEnd':
          const paddingEnd: FlexProps['paddingEnd'] = v;

          if (ss && paddingEnd !== undefined) {
            ss.paddingEnd = paddingEnd;
          }
          break;

        // margins
        case 'ma':
          const ma: FlexProps['ma'] = v;

          if (ss && ma !== undefined) {
            ss.margin = ma;
          }
          break;
        case 'mh':
          const mh: FlexProps['mh'] = v;

          if (ss && mh !== undefined) {
            ss.marginHorizontal = mh;
          }
          break;
        case 'mv':
          const mv: FlexProps['mv'] = v;

          if (ss && mv !== undefined) {
            ss.marginVertical = mv;
          }
          break;
        case 'ml':
          const ml: FlexProps['ml'] = v;

          if (ss && ml !== undefined) {
            ss.marginLeft = ml;
          }
          break;
        case 'mr':
          const mr: FlexProps['mr'] = v;

          if (ss && mr !== undefined) {
            ss.marginRight = mr;
          }
          break;
        case 'mt':
          const mt: FlexProps['mt'] = v;

          if (ss && mt !== undefined) {
            ss.marginTop = mt;
          }
          break;
        case 'mb':
          const mb: FlexProps['mb'] = v;

          if (ss && mb !== undefined) {
            ss.marginBottom = mb;
          }
          break;
        case 'marginLeft':
          const marginLeft: FlexProps['marginLeft'] = v;

          if (ss && marginLeft !== undefined) {
            ss.marginLeft = marginLeft;
          }
          break;
        case 'marginRight':
          const marginRight: FlexProps['marginRight'] = v;

          if (ss && marginRight !== undefined) {
            ss.marginRight = marginRight;
          }
          break;
        case 'marginTop':
          const marginTop: FlexProps['marginTop'] = v;

          if (ss && marginTop !== undefined) {
            ss.marginTop = marginTop;
          }
          break;
        case 'marginBottom':
          const marginBottom: FlexProps['marginBottom'] = v;

          if (ss && marginBottom !== undefined) {
            ss.marginBottom = marginBottom;
          }
          break;
        case 'marginVertical':
          const marginVertical: FlexProps['marginVertical'] = v;

          if (ss && marginVertical !== undefined) {
            ss.marginVertical = marginVertical;
          }
          break;
        case 'marginHorizontal':
          const marginHorizontal: FlexProps['marginHorizontal'] = v;

          if (ss && marginHorizontal !== undefined) {
            ss.marginHorizontal = marginHorizontal;
          }
          break;
        case 'margin':
          const margin: FlexProps['margin'] = v;

          if (ss && margin !== undefined) {
            ss.margin = margin;
          }
          break;

        // side
        case 'top':
          const top: FlexProps['top'] = v;

          if (ss && top !== undefined) {
            ss.top = top === true ? 0 : top;
          }
          break;
        case 'right':
          const right: FlexProps['right'] = v;

          if (ss && right !== undefined) {
            ss.right = right === true ? 0 : right;
          }
          break;
        case 'left':
          const left: FlexProps['left'] = v;

          if (ss && left !== undefined) {
            ss.left = left === true ? 0 : left;
          }
          break;
        case 'bottom':
          const bottom: FlexProps['bottom'] = v;

          if (ss && bottom !== undefined) {
            ss.bottom = bottom === true ? 0 : bottom;
          }
          break;

        // size
        case 'height':
          const height: FlexProps['height'] = v;

          if (ss && height !== undefined) {
            ss.height = height === true ? '100%' : height;
          }
          break;
        case 'minHeight':
          const minHeight: FlexProps['minHeight'] = v;

          if (ss && minHeight !== undefined) {
            ss.minHeight = minHeight;
          }
          break;
        case 'maxHeight':
          const maxHeight: FlexProps['maxHeight'] = v;

          if (ss && maxHeight !== undefined) {
            ss.maxHeight = maxHeight;
          }
          break;
        case 'width':
          const width: FlexProps['width'] = v;

          if (ss && width !== undefined) {
            ss.width = width === true ? '100%' : width;
          }
          break;
        case 'minWidth':
          const minWidth: FlexProps['minWidth'] = v;

          if (ss && minWidth !== undefined) {
            ss.minWidth = minWidth;
          }
          break;
        case 'maxWidth':
          const maxWidth: FlexProps['pt'] = v;

          if (ss && maxWidth !== undefined) {
            ss.maxWidth = maxWidth;
          }
          break;

        // flex layout
        case 'flex':
          const flex: FlexProps['flex'] = v;

          if (ss && flex !== undefined) {
            ss.flex = flex === true ? 1 : flex;
          }
          break;
        case 'flexGrow':
          const flexGrow: FlexProps['flexGrow'] = v;

          if (ss && flexGrow !== undefined) {
            ss.flexGrow = flexGrow === true ? 1 : flexGrow;
          }
          break;
        case 'flexWrap':
          const flexWrap: FlexProps['flexWrap'] = v;

          if (ss && flexWrap !== undefined) {
            ss.flexWrap = flexWrap;
          }
          break;
        case 'wrap':
          const wrap: FlexProps['wrap'] = v;

          if (ss && wrap !== undefined) {
            ss.flexWrap = wrap === true ? 'wrap' : wrap;
          }
          break;
        case 'flexShrink':
          const flexShrink: FlexProps['flexShrink'] = v;

          if (ss && flexShrink !== undefined) {
            ss.flexShrink = flexShrink === true ? 1 : flexShrink;
          }
          break;
        case 'flexBasis':
          const flexBasis: FlexProps['flexBasis'] = v;

          if (ss && flexBasis !== undefined) {
            ss.flexBasis = flexBasis;
          }
          break;

        // flex direction
        case 'col':
          if (ss && v) {
            ss.flexDirection = 'column';
          }
          break;
        case 'row':
          if (ss && v) {
            ss.flexDirection = 'row';
          }
          break;

        // align
        case 'alignItems':
          const alignItems: FlexProps['alignItems'] = v;

          if (ss && alignItems !== undefined) {
            ss.alignItems = alignItems;
          }
          break;
        case 'alignSelf':
          const alignSelf: FlexProps['alignSelf'] = v;

          if (ss && alignSelf) {
            ss.alignSelf = alignSelf;
          }
          break;
        case 'justifyContent':
          const justifyContent: FlexProps['justifyContent'] = v;

          if (ss && justifyContent !== undefined) {
            ss.justifyContent = justifyContent;
          }
          break;
        case 'centerContent':
          const centerContent: FlexProps['centerContent'] = v;

          if (ss && centerContent) {
            ss.alignItems = 'center';
            ss.justifyContent = 'center';
          }
          break;
        case 'alignContent':
          const alignContent: FlexProps['alignContent'] = v;

          if (ss && alignContent !== undefined) {
            ss.alignContent = alignContent;
          }
          break;

        // position
        case 'absolute':
          const absolute: FlexProps['absolute'] = v;

          if (ss && absolute) {
            ss.position = 'absolute';
          }
          break;
        case 'absoluteFill':
          const absoluteFill: FlexProps['absoluteFill'] = v;

          if (ss && absoluteFill) {
            ss.position = 'absolute';
            ss.left = 0;
            ss.right = 0;
            ss.top = 0;
            ss.bottom = 0;
          }
          break;
        case 'zIndex':
          const zIndex: FlexProps['zIndex'] = v;

          if (ss && zIndex) {
            ss.zIndex = zIndex;
          }
          break;

        // border
        case 'radius':
          const radius: FlexProps['radius'] = v;

          if (ss && radius !== undefined) {
            ss.borderRadius = radius;
          }
          break;
        case 'circle':
          const circle: FlexProps['circle'] = v;

          if (ss && circle !== undefined) {
            ss.width = circle;
            ss.height = circle;
            ss.borderRadius = circle / 2;
          }
          break;
        case 'topRadius':
          const topRadius: FlexProps['topRadius'] = v;

          if (ss && topRadius !== undefined) {
            ss.borderTopLeftRadius = topRadius;
            ss.borderTopRightRadius = topRadius;
          }
          break;
        case 'bottomRadius':
          const bottomRadius: FlexProps['bottomRadius'] = v;

          if (ss && bottomRadius !== undefined) {
            ss.borderBottomLeftRadius = bottomRadius;
            ss.borderBottomRightRadius = bottomRadius;
          }
          break;
        case 'leftRadius':
          const leftRadius: FlexProps['leftRadius'] = v;

          if (ss && leftRadius !== undefined) {
            ss.borderBottomLeftRadius = leftRadius;
            ss.borderTopLeftRadius = leftRadius;
          }
          break;
        case 'rightRadius':
          const rightRadius: FlexProps['rightRadius'] = v;

          if (ss && rightRadius !== undefined) {
            ss.borderBottomRightRadius = rightRadius;
            ss.borderTopRightRadius = rightRadius;
          }
          break;
        case 'borderColor':
          const borderColor: FlexProps['borderColor'] = v;

          if (ss && borderColor !== undefined) {
            ss.borderColor = borderColor;
          }
          break;
        case 'borderWidth':
          const borderWidth: FlexProps['borderWidth'] = v;

          if (ss && borderWidth !== undefined) {
            ss.borderWidth = borderWidth;
          }
          break;
        case 'borderBottomWidth':
          const borderBottomWidth: FlexProps['borderBottomWidth'] = v;

          if (ss && borderBottomWidth !== undefined) {
            ss.borderBottomWidth = borderBottomWidth;
          }
          break;
        case 'borderTopWidth':
          const borderTopWidth: FlexProps['borderTopWidth'] = v;

          if (ss && borderTopWidth !== undefined) {
            ss.borderTopWidth = borderTopWidth;
          }
          break;

        // transform
        case 'animated':
          const animated: FlexProps['animated'] = v;

          if (ss && animated) {
            ss.transform = [];
          }
          break;
        case 'rotate':
          const rotate: FlexProps['rotate'] = v;

          if (ss && rotate !== undefined) {
            (ss.transform as any)?.push({rotate});
          }
          break;
        case 'translateX':
          const translateX: FlexProps['translateX'] = v;

          if (ss && translateX !== undefined) {
            (ss.transform as any)?.push({translateX});
          }
          break;
        case 'translateY':
          const translateY: FlexProps['translateY'] = v;

          if (ss && translateY !== undefined) {
            (ss.transform as any)?.push({translateY});
          }
          break;
        case 'scale':
          const scale: FlexProps['scale'] = v;

          if (ss && scale !== undefined) {
            (ss.transform as any)?.push({scale});
          }
          break;

        // shadow
        case 'elevation':
          const elevation: FlexProps['elevation'] = v;

          if (ss && elevation !== undefined) {
            if (elevation !== undefined) {
              Object.assign(ss, shadowStyle(elevation));
            }
          }
          break;

        // debug
        case 'debug':
          const debug: FlexProps['debug'] = v;

          if (ss && debug) {
            ss.backgroundColor = 'red';
          }
          break;

        // color
        case 'bg':
          const bg: FlexProps['bg'] = v;

          if (ss && bg !== undefined) {
            ss.backgroundColor = bg;
          }
          break;
        case 'opacity':
          const opacity: FlexProps['opacity'] = v;

          if (ss && opacity !== undefined) {
            ss.opacity = opacity as any;
          }
          break;

        // text
        case 'color':
          const color: FlexProps['color'] = v;

          if (ss && color !== undefined) {
            ss.color = color as any;
          }
          break;
        case 'fontFamily':
          const fontFamily: FlexProps['fontFamily'] = v;

          if (ss && fontFamily !== undefined) {
            ss.fontFamily = fontFamily;
          }
          break;
        case 'fontSize':
          const fontSize: FlexProps['fontSize'] = v;

          if (ss && fontSize !== undefined) {
            ss.fontSize = fontSize as any;
          }
          break;
        case 'fontStyle':
          const fontStyle: FlexProps['fontStyle'] = v;

          if (ss && fontStyle !== undefined) {
            ss.fontStyle = fontStyle;
          }
          break;
        case 'fontWeight':
          const fontWeight: FlexProps['fontWeight'] = v;

          if (ss && fontWeight !== undefined) {
            ss.fontWeight = fontWeight as any;
          }
          break;
        case 'letterSpacing':
          const letterSpacing: FlexProps['letterSpacing'] = v;

          if (ss && letterSpacing !== undefined) {
            ss.letterSpacing = letterSpacing;
          }
          break;
        case 'lineHeight':
          const lineHeight: FlexProps['lineHeight'] = v;

          if (ss && lineHeight !== undefined) {
            ss.lineHeight = lineHeight as any;
          }
          break;
        case 'textAlign':
          const textAlign: FlexProps['textAlign'] = v;

          if (ss && textAlign !== undefined) {
            ss.textAlign = textAlign;
          }
          break;
        case 'textDecorationLine':
          const textDecorationLine: FlexProps['textDecorationLine'] = v;

          if (ss && textDecorationLine !== undefined) {
            ss.textDecorationLine = textDecorationLine as any;
          }
          break;
        case 'textDecorationStyle':
          const textDecorationStyle: FlexProps['textDecorationStyle'] = v;

          if (ss && textDecorationStyle !== undefined) {
            ss.textDecorationStyle = textDecorationStyle;
          }
          break;
        case 'textDecorationColor':
          const textDecorationColor: FlexProps['textDecorationColor'] = v;

          if (ss && textDecorationColor !== undefined) {
            ss.textDecorationColor = textDecorationColor;
          }
          break;
        case 'textTransform':
          const textTransform: FlexProps['textTransform'] = v;

          if (ss && textTransform !== undefined) {
            ss.textTransform = textTransform;
          }
          break;

        case 'overflow':
          const overflow: FlexProps['overflow'] = v;

          if (ss && overflow !== undefined) {
            ss.overflow = !overflow
              ? 'hidden'
              : overflow
              ? 'visible'
              : overflow;
          }
          break;

        case 'style':
          const style: FlexProps['style'] = v;

          if (ss && style !== undefined) {
            Object.assign(ss, StyleSheet.flatten(style));
          }
          break;

        default:
          isOwnProp = true;
          break;
      }

      if (outOwnProps && isOwnProp) {
        (outOwnProps as any)[key] = v;
      }
      if (sp && !isOwnProp) {
        (sp as any)[key] = v;
      }
    }
  }
}
