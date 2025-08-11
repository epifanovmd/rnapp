import { useMergedCallback } from "@common";
import { mergeRefs } from "@force-dev/react";
import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { Icon, TIconName } from "../icon";

export interface IRNVITextFieldProps extends Omit<TextInputProps, "style"> {
  readonly label?: string;
  readonly error?: string | boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly iconName?: TIconName;
  readonly iconColor?: string;
  readonly hint?: string;
  readonly hintPosition?: "left" | "right";
  readonly clearable?: boolean;
  readonly showSymbolCount?: boolean;
  readonly duration?: number;
}

const ANIMATION_DURATION = 150;

export const TextField = memo(
  forwardRef<TextInput, IRNVITextFieldProps>(
    (
      {
        label,
        value,
        placeholder: _placeholder,
        error,
        style,
        iconName,
        iconColor,
        hint,
        hintPosition = "right",
        clearable,
        maxLength,
        showSymbolCount,
        duration = ANIMATION_DURATION,
        multiline,
        numberOfLines = multiline ? 6 : 1,
        onFocus: _onFocus,
        onBlur: _onBlur,
        onChangeText: _onChangeText,
        onLayout,
        editable,
        secureTextEntry: _secureTextEntry,
        ...otherProps
      },
      ref,
    ) => {
      const inputRef = React.useRef<TextInput>(null);
      const maxWidth = useRef(0);
      const [width, setWidth] = useState(0);
      const [isFocused, setFocused] = useState(false);
      const [hasValue, setHasValue] = useState(false);
      const [localValue, setLocalValue] = useState("");
      const [secureTextEntry, setsSecureTextEntry] = useState(_secureTextEntry);

      const ss = useMemo(() => {
        const captionMTextStyle = { fontSize: 12, lineHeight: 16 };
        const bodyMTextStyle = { fontSize: 16, lineHeight: 20 };

        const elevationColor = "#F5F5F7";
        const primaryColor = "#007AFF";
        const primaryTextColor = "#18191C";
        const secondaryColor = "#75767F";
        const redColor = "#D73434";
        const tertiaryTextColor = "#B2B2B7";

        return {
          elevationColor,
          captionMTextStyle,
          bodyMTextStyle,
          primaryColor,
          primaryTextColor,
          secondaryColor,
          redColor,
          tertiaryTextColor,
        };
      }, []);

      useEffect(() => {
        setLocalValue("");
        setHasValue(!!value);
      }, [value]);

      useEffect(() => {
        setsSecureTextEntry(_secureTextEntry);
      }, [_secureTextEntry]);

      const isShowLabel = !!label;
      const isShowSecureButton = _secureTextEntry;
      const isShowError = !!error;
      const isShowClear = clearable && hasValue && !isShowError;
      const isShowCounter = !!showSymbolCount && !!maxLength;
      const isShowRight = isShowClear || isShowError || isShowSecureButton;
      const isActiveInput = (isFocused || hasValue) && isShowLabel;
      const isLeftHint = hintPosition === "left";
      const isRightHint = hintPosition === "right";
      const isShowHintLeft = !!hint && isLeftHint && !multiline;
      const isShowHintRight = !!hint && isRightHint && !multiline;
      const isLocalValue =
        value === undefined && (isShowHintRight || isShowCounter || multiline);
      const finalValue = isLocalValue ? localValue : value;
      const placeholder = _placeholder && isFocused ? _placeholder : undefined;
      const valueLength = finalValue?.length ?? 0;
      const disabled = editable === false;

      const labelStyles = useAnimatedStyle(() => {
        const isActive = isFocused || hasValue;
        const {
          primaryColor,
          secondaryColor,
          redColor,
          captionMTextStyle,
          bodyMTextStyle,
        } = ss;

        const color = isShowError
          ? redColor
          : isActive
          ? primaryColor
          : secondaryColor;
        const textStyle = isActive ? captionMTextStyle : bodyMTextStyle;

        const fontSize = textStyle?.fontSize;

        return {
          ...textStyle,
          fontSize: fontSize && withTiming(fontSize, { duration }),
          top: withTiming(isActive ? 0 : 12, { duration }),
          color: color && withTiming(color, { duration }),
        };
      }, [isFocused, hasValue, ss, isShowError, duration]);

      const inputRowStyles = useAnimatedStyle(
        () => ({
          paddingTop: withTiming(isActiveInput ? 16 : 0, { duration }),
        }),
        [isActiveInput, duration],
      );

      const bottomStyles = useAnimatedStyle(() => {
        const isShow = isShowError || isShowCounter;

        return {
          marginTop: isShow ? 4 : 0,
          height: withTiming(isShow ? 16 : 0, { duration }),
        };
      }, [isShowError, isShowCounter, duration]);

      const animatedOpacity = useAnimatedStyle(
        () => ({
          opacity: withTiming(isActiveInput ? 1 : 0, {
            duration,
          }),
        }),
        [isActiveInput],
      );

      const onFocus = useMergedCallback(
        _onFocus,
        useCallback(() => setFocused(true), []),
      );

      const onBlur = useMergedCallback(
        _onBlur,
        useCallback(() => setFocused(false), []),
      );

      const onPressWrap = useCallback(() => {
        inputRef.current?.focus();
      }, []);

      const handleChangeText = useCallback(
        (text: string) => {
          if (isLocalValue) {
            setLocalValue(text);
          }
          setHasValue(!!text);
        },
        [isLocalValue],
      );

      const onChangeText = useMergedCallback<[string]>(
        _onChangeText,
        handleChangeText,
      );

      const handleClear = useCallback(() => {
        inputRef.current?.clear();
        onChangeText?.("");
      }, [onChangeText]);

      const onLayoutFakeText = useCallback(
        (e: LayoutChangeEvent) => {
          const width = !hasValue ? 0 : e.nativeEvent.layout.width;

          setWidth(width > maxWidth.current ? maxWidth.current : width);
        },
        [hasValue],
      );

      const handleMeasureMaxWidth = useCallback((e: LayoutChangeEvent) => {
        maxWidth.current = e.nativeEvent.layout.width;
      }, []);

      const onLayoutTextInput = useMergedCallback(
        onLayout,
        handleMeasureMaxWidth,
      );

      const toggleSecureTextEntry = useCallback(() => {
        setsSecureTextEntry(state => !state);
      }, []);

      const secureIcon: TIconName = secureTextEntry ? "eyeOff" : "eye";
      const isLimLen = maxLength && valueLength > maxLength;
      const selectionColor = isShowError ? ss.redColor : ss.primaryColor;
      const counterColor = isLimLen ? ss.redColor : ss.tertiaryTextColor;
      const counterText = `${valueLength} / ${maxLength}`;
      const wrapStyles = [s.wrap, { backgroundColor: ss.elevationColor }];
      const inputStyles = [ss.bodyMTextStyle, { color: ss.primaryTextColor }];
      const hintStyles = [
        ss.bodyMTextStyle,
        { color: ss.tertiaryTextColor },
        animatedOpacity,
      ];
      const transformHint = {
        transform: [{ translateX: -(maxWidth.current - width) }],
      };
      const errorStyles = [ss.captionMTextStyle, { color: ss.redColor }];
      const counterStyles = [ss.captionMTextStyle, { color: counterColor }];

      return (
        <View style={style}>
          {isShowHintRight && (
            <Text
              style={[s.fakeText, ss.bodyMTextStyle]}
              onLayout={onLayoutFakeText}
            >
              {finalValue}
            </Text>
          )}
          <TouchableOpacity
            disabled={disabled}
            activeOpacity={1}
            onPress={onPressWrap}
            style={wrapStyles}
          >
            {!!iconName && (
              <View style={s.left}>
                <View style={s.iconWrap}>
                  <Icon
                    style={s.iconSize}
                    height={24}
                    width={24}
                    fill={iconColor}
                    name={iconName}
                  />
                </View>
              </View>
            )}
            <View style={s.center}>
              {!!label && (
                <Animated.Text style={[s.label, labelStyles]}>
                  {label}
                </Animated.Text>
              )}
              <Animated.View style={[s.inputRow, inputRowStyles]}>
                {isShowHintLeft && (
                  <Animated.Text style={[s.hintLeft, hintStyles]}>
                    {hint}
                  </Animated.Text>
                )}
                <TextInput
                  ref={mergeRefs([inputRef, ref])}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  value={finalValue}
                  placeholder={placeholder}
                  placeholderTextColor={ss.tertiaryTextColor}
                  maxLength={maxLength}
                  onChangeText={onChangeText}
                  selectionColor={selectionColor}
                  style={[s.input, inputStyles]}
                  multiline={multiline}
                  numberOfLines={numberOfLines}
                  onLayout={onLayoutTextInput}
                  editable={editable}
                  secureTextEntry={secureTextEntry}
                  {...otherProps}
                />
                {isShowHintRight && (
                  <Animated.Text
                    style={[s.hintRight, hintStyles, transformHint]}
                  >
                    {hint}
                  </Animated.Text>
                )}
              </Animated.View>
            </View>
            {isShowRight && (
              <View style={s.right}>
                {isShowSecureButton && (
                  <TouchableOpacity
                    disabled={disabled}
                    activeOpacity={1}
                    style={s.iconWrap}
                    onPress={toggleSecureTextEntry}
                  >
                    <Icon
                      style={s.iconSize}
                      fill={ss.tertiaryTextColor}
                      name={secureIcon}
                    />
                  </TouchableOpacity>
                )}
                {isShowClear && (
                  <TouchableOpacity
                    disabled={disabled}
                    activeOpacity={1}
                    style={s.iconWrap}
                    onPress={handleClear}
                  >
                    <Icon
                      style={s.iconSize}
                      fill={ss.tertiaryTextColor}
                      name={"close"}
                    />
                  </TouchableOpacity>
                )}
                {isShowError && (
                  <View style={s.iconWrap}>
                    <Icon
                      style={s.iconSize}
                      fill={ss.redColor}
                      name={"closeCircle"}
                    />
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
          <Animated.View style={[s.bottom, bottomStyles]}>
            {isShowError && <Text style={errorStyles}>{error}</Text>}
            {isShowCounter && (
              <Text style={[s.counter, counterStyles]}>{counterText}</Text>
            )}
          </Animated.View>
        </View>
      );
    },
  ),
);

const s = StyleSheet.create({
  fakeText: {
    position: "absolute",
    top: 0,
    minWidth: 0,
    height: 0,
    opacity: 0,
    pointerEvents: "none",
  },
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    minHeight: 60,
  },
  label: {
    position: "absolute",
  },
  inputRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  input: {
    alignSelf: "stretch",
    flex: 1,
    minHeight: 24,
    padding: 0,
    overflow: "hidden",
  },
  hintLeft: {
    paddingRight: 4,
  },
  hintRight: {
    paddingLeft: 4,
  },
  iconWrap: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconSize: {
    height: 24,
    width: 24,
  },
  left: {
    gap: 8,
    paddingVertical: 8,
    flexDirection: "row",
    marginBottom: "auto",
    marginRight: 8,
  },
  center: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    alignSelf: "stretch",
  },
  right: {
    gap: 8,
    paddingVertical: 8,
    flexDirection: "row",
    marginBottom: "auto",
    marginLeft: 8,
  },
  bottom: {
    height: 0,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  counter: {
    marginLeft: "auto",
  },
});
