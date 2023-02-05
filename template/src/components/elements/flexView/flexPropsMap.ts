import {FlexProps} from './types';
import {TextStyle, ViewStyle} from 'react-native';
import {shadowStyle} from './shadowStyle';

const isBoolean = <U>(term: boolean | U): term is boolean =>
  typeof term === 'boolean';

type Style = ViewStyle & TextStyle;
type HasTrueType<T, R> = T extends true ? R : never;

// styleMapGenerator
const smg = <
  FPN extends keyof FlexProps<Style>,
  SN extends keyof Style = keyof Style,
>(
  flexPropsName: FPN[],
  style?: SN[],
  positiveValue?: HasTrueType<FlexProps<Style>[FPN], Style[SN]>,
  negativeValue?: HasTrueType<FlexProps<Style>[FPN], Style[SN]>,
): Record<FPN, (value: FlexProps<Style>[FPN]) => Record<SN, Style[SN]>> => {
  return flexPropsName.reduce<any>((acc, item) => {
    acc[item] = (value: FlexProps<Style>[FPN]) => {
      return (style || (flexPropsName as any[])).reduce<any>((ac, itm) => {
        ac[itm] = isBoolean(value)
          ? positiveValue || negativeValue || value
          : value;

        return ac;
      }, {}) as Record<SN, Style[SN]>;
    };

    return acc;
  }, {});
};

// TransformStyleMapGenerator
const tsmg = <FPN extends keyof FlexProps<Style>>(flexPropsName: FPN) => {
  return {
    [flexPropsName]: (value: FlexProps<Style>[FPN]) => {
      return {
        transform: [{[flexPropsName]: value}],
      };
    },
  };
};

export const flexPropsMap = {
  ...smg(['paddingLeft', 'pl'], ['paddingLeft']),
  ...smg(['paddingRight', 'pr'], ['paddingRight']),
  ...smg(['paddingTop', 'pt'], ['paddingTop']),
  ...smg(['paddingBottom', 'pb'], ['paddingBottom']),
  ...smg(['paddingVertical', 'pv'], ['paddingVertical']),
  ...smg(['paddingHorizontal', 'ph'], ['paddingHorizontal']),
  ...smg(['padding', 'pa'], ['padding']),
  ...smg(['paddingStart'], ['paddingStart']),
  ...smg(['paddingEnd'], ['paddingEnd']),

  ...smg(['marginLeft', 'ml'], ['marginLeft']),
  ...smg(['marginRight', 'mr'], ['marginRight']),
  ...smg(['marginTop', 'mt'], ['marginTop']),
  ...smg(['marginBottom', 'mb'], ['marginBottom']),
  ...smg(['marginVertical', 'mv'], ['marginVertical']),
  ...smg(['marginHorizontal', 'mh'], ['marginHorizontal']),
  ...smg(['margin', 'ma'], ['padding']),

  ...smg(['left'], ['left'], 0),
  ...smg(['right'], ['right'], 0),
  ...smg(['top'], ['top'], 0),
  ...smg(['bottom'], ['bottom'], 0),

  ...smg(['height'], ['height'], '100%'),
  ...smg(['minHeight']),
  ...smg(['maxHeight']),
  ...smg(['width'], ['width'], '100%'),
  ...smg(['minWidth']),
  ...smg(['maxWidth']),

  ...smg(['flex']),
  ...smg(['flexGrow'], ['flexGrow'], 1),
  ...smg(['flexBasis']),
  ...smg(['flexWrap']),
  ...smg(['flexShrink'], ['flexShrink'], 1),

  ...smg(['row'], ['flexDirection'], 'row'),
  ...smg(['col'], ['flexDirection'], 'column'),
  ...smg(['wrap'], ['flexWrap'], 'wrap'),

  ...smg(['alignItems']),
  ...smg(['alignSelf']),
  ...smg(['justifyContent']),
  ...smg(['centerContent'], ['alignItems', 'justifyContent'], 'center'),
  ...smg(['alignContent']),

  ...smg(['absolute'], ['position'], 'absolute'),
  absoluteFill: (value: FlexProps<Style>['absoluteFill']): Style =>
    value ? {position: 'absolute', left: 0, right: 0, top: 0, bottom: 0} : {},
  ...smg(['zIndex']),
  ...smg(['radius'], ['borderRadius']),
  ...smg(['topRadius'], ['borderTopLeftRadius', 'borderTopRightRadius']),
  ...smg(
    ['bottomRadius'],
    ['borderBottomLeftRadius', 'borderBottomRightRadius'],
  ),
  ...smg(['leftRadius'], ['borderBottomLeftRadius', 'borderTopLeftRadius']),
  ...smg(['rightRadius'], ['borderBottomRightRadius', 'borderTopRightRadius']),
  circle: (value: FlexProps<Style>['circle']): Style => ({
    width: value,
    height: value,
    borderRadius: (value || 0) / 2,
  }),
  ...smg(['overflow']),
  ...smg(['borderColor']),
  ...smg(['borderWidth']),
  ...smg(['borderBottomWidth']),
  ...smg(['borderTopWidth']),
  ...smg(['borderLeftWidth']),
  ...smg(['borderRightWidth']),

  ...smg(['animated'], ['transform'], []),

  ...tsmg('rotate'),
  ...tsmg('translateX'),
  ...tsmg('translateY'),
  ...tsmg('scale'),

  elevation: shadowStyle,

  ...smg(['debug'], ['backgroundColor'], 'red'),
  ...smg(['bg'], ['backgroundColor']),
  ...smg(['opacity'], ['opacity']),

  ...smg(['color']),
  ...smg(['fontFamily']),
  ...smg(['fontSize']),
  ...smg(['fontStyle']),
  ...smg(['fontWeight']),
  ...smg(['letterSpacing']),
  ...smg(['lineHeight']),
  ...smg(['textAlign']),
  ...smg(['textDecorationLine']),
  ...smg(['textDecorationStyle']),
  ...smg(['textDecorationColor']),
  ...smg(['textTransform']),
};

// проверка, все ли ключи FlexProps включены в мапу
type LostScreenParamsTypes = Exclude<
  keyof Omit<
    FlexProps<Style>,
    'style' | 'rotate' | 'translateX' | 'translateY' | 'scale'
  >,
  keyof typeof flexPropsMap
> extends never
  ? true
  : false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CheckError: LostScreenParamsTypes = true;
