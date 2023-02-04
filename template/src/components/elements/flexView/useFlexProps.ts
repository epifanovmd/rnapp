import {ImageStyle, StyleSheet, TextStyle, ViewStyle} from 'react-native';
import {FlexProps} from './types';
import {useMemo} from 'react';
import {flexPropsMap} from './flexPropsMap';

export const useFlexProps = <
  TProps extends FlexProps<ViewStyle | TextStyle>,
  TOwnProps extends Omit<TProps, keyof FlexProps<ViewStyle | TextStyle>> = Omit<
    TProps,
    keyof FlexProps<ViewStyle | TextStyle>
  >,
  TStyleSource extends ViewStyle | TextStyle | ImageStyle =
    | ViewStyle
    | TextStyle
    | ImageStyle,
>(
  props: TProps,
  defaultProps?: Partial<TProps>,
) =>
  useMemo(() => {
    const ownProps = {} as TOwnProps;
    const styleSource = {} as TStyleSource;

    viewStylePropsConverter({...defaultProps, ...props}, ownProps, styleSource);
    const style = StyleSheet.create({style: styleSource});

    if (typeof props.debug === 'string') {
      console.log(`FlexView::render ${props.debug}`); // 🐞 ✅
    }

    return {
      animated: props.animated,
      style: style.style,
      ownProps,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

function viewStylePropsConverter<
  TProps extends FlexProps,
  TOwnProps = Omit<TProps, keyof FlexProps>,
  TStyleSource extends TextStyle & ViewStyle = TextStyle & ViewStyle,
>(props: TProps, outOwnProps: TOwnProps, outStyleSource: TStyleSource) {
  const op = outOwnProps as any;
  const os = outStyleSource as any;

  for (const key in props) {
    const flexTransformer =
      flexPropsMap[
        key as keyof Omit<
          FlexProps,
          'style' | 'rotate' | 'translateX' | 'translateY' | 'scale'
        >
      ];

    if (props.hasOwnProperty(key)) {
      if (flexTransformer) {
        const propValue = props[key];
        const styleParams = flexTransformer(propValue as any);

        for (const styleKey in styleParams) {
          if (styleParams.hasOwnProperty(styleKey)) {
            if (styleKey === 'transform') {
              os[styleKey] = [
                ...(os[styleKey] || []),
                ...styleParams[styleKey],
              ];
            } else {
              os[styleKey] = styleParams[styleKey];
            }
          }
        }
      } else {
        if (key !== 'style') {
          op[key] = props[key];
        }
      }
    }
  }

  if (props.style) {
    Object.assign(os, props.style);
  }
}
