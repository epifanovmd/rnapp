import { useMergedCallback } from "@shared/lib/hooks";
import { mergeRefs } from "@shared/lib/hooks/merge-refs";
import { useTheme } from "@shared/lib/theme";
import React, { forwardRef, useCallback, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { Icon, TIconName } from "../icon";
import { getTextStyle } from "../text";
import {
  TextFieldAccessories,
  TextFieldFooter,
  TextFieldLabel,
} from "./components";
import { useTextFieldState } from "./hooks";
import { TextInput, TextInputProps } from "./Input";

export interface ITextFieldProps extends Omit<TextInputProps, "style"> {
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
  /** Произвольный контент слева (после iconName). */
  readonly left?: React.ReactNode;
  /** Произвольный контент справа (до системных иконок). */
  readonly right?: React.ReactNode;
}

/** @deprecated Используй ITextFieldProps. */
export type IRNVITextFieldProps = ITextFieldProps;

const ANIMATION_DURATION = 150;
const BODY = getTextStyle("Body_M2");

/**
 * Поле ввода: плавающий label, secure/clear/error-аксессуары, счётчик,
 * hint. Состояние — useTextFieldState, визуальные части — TextFieldLabel /
 * TextFieldAccessories / TextFieldFooter; здесь — только layout и wiring.
 */
export const TextField = forwardRef<RNTextInput, ITextFieldProps>(
  (
    {
      label,
      value,
      placeholder: rawPlaceholder,
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
      onFocus,
      onBlur,
      onChangeText,
      onLayout,
      editable,
      secureTextEntry,
      left,
      right,
      ...otherProps
    },
    ref,
  ) => {
    const inputRef = useRef<RNTextInput>(null);
    const inputWidth = useRef(0);
    const [valueWidth, setValueWidth] = useState(0);
    const { colors } = useTheme();

    const showCounter = !!showSymbolCount && !!maxLength;
    const showHintLeft = !!hint && hintPosition === "left" && !multiline;
    const showHintRight = !!hint && hintPosition === "right" && !multiline;

    const {
      isFocused,
      hasValue,
      finalValue,
      secure,
      toggleSecure,
      focusInput,
      handleFocus,
      handleBlur,
      handleChangeText,
      handleClear,
    } = useTextFieldState({
      value,
      secureTextEntry,
      trackLocalValue: showHintRight || showCounter || !!multiline,
      inputRef,
      onFocus,
      onBlur,
      onChangeText,
    });

    const disabled = editable === false;
    const showError = !!error;
    const active = isFocused || hasValue;
    const labelActive = active && !!label;
    const showClear = !!clearable && hasValue && !showError;
    const placeholder =
      rawPlaceholder && (isFocused || !label) ? rawPlaceholder : undefined;
    const valueLength = finalValue?.length ?? 0;

    const inputRowStyle = useAnimatedStyle(
      () => ({
        paddingTop: withTiming(labelActive ? 16 : 0, { duration }),
      }),
      [labelActive, duration],
    );

    const hintStyle = useAnimatedStyle(
      () => ({
        opacity: withTiming(active ? 1 : 0, { duration }),
      }),
      [active, duration],
    );

    // Right-hint позиционируется сразу после текста: ширина значения
    // измеряется невидимым Text-дублёром.
    const handleValueWidth = useCallback(
      (event: LayoutChangeEvent) => {
        const width = !hasValue ? 0 : event.nativeEvent.layout.width;

        setValueWidth(Math.min(width, inputWidth.current));
      },
      [hasValue],
    );

    const handleInputWidth = useCallback((event: LayoutChangeEvent) => {
      inputWidth.current = event.nativeEvent.layout.width;
    }, []);

    const handleInputLayout = useMergedCallback(onLayout, handleInputWidth);

    return (
      <View style={[style, disabled && styles.disabled]}>
        {showHintRight && (
          <RNText
            style={[styles.valueMeasurer, BODY]}
            onLayout={handleValueWidth}
          >
            {finalValue}
          </RNText>
        )}
        <TouchableOpacity
          disabled={disabled}
          activeOpacity={1}
          onPress={focusInput}
          style={[styles.wrap, { backgroundColor: colors.onSurface }]}
        >
          {(!!iconName || !!left) && (
            <View style={[styles.left, multiline && styles.leftTop]}>
              {!!iconName && (
                <Icon
                  color={iconColor ?? colors.textTertiary}
                  name={iconName}
                />
              )}
              {left}
            </View>
          )}
          <View style={styles.center}>
            {!!label && (
              <TextFieldLabel
                label={label}
                active={active}
                error={showError}
                duration={duration}
              />
            )}
            <Animated.View style={[styles.inputRow, inputRowStyle]}>
              {showHintLeft && (
                <Animated.Text
                  style={[
                    styles.hintLeft,
                    BODY,
                    { color: colors.textTertiary },
                    hintStyle,
                  ]}
                >
                  {hint}
                </Animated.Text>
              )}
              <TextInput
                ref={mergeRefs([inputRef, ref])}
                onFocus={handleFocus}
                onBlur={handleBlur}
                value={finalValue}
                placeholder={placeholder}
                placeholderTextColor={colors.textTertiary}
                maxLength={maxLength}
                onChangeText={handleChangeText}
                selectionColor={showError ? colors.danger : colors.primary}
                style={[styles.input, BODY, { color: colors.textPrimary }]}
                multiline={multiline}
                numberOfLines={numberOfLines}
                onLayout={handleInputLayout}
                editable={editable}
                secureTextEntry={secure}
                {...otherProps}
              />
              {showHintRight && (
                <Animated.Text
                  style={[
                    styles.hintRight,
                    BODY,
                    { color: colors.textTertiary },
                    hintStyle,
                    {
                      transform: [
                        { translateX: -(inputWidth.current - valueWidth) },
                      ],
                    },
                  ]}
                >
                  {hint}
                </Animated.Text>
              )}
            </Animated.View>
          </View>
          <TextFieldAccessories
            alignTop={!!multiline}
            showSecureToggle={!!secureTextEntry}
            secure={secure}
            onToggleSecure={toggleSecure}
            showClear={showClear}
            onClear={handleClear}
            showError={showError}
            disabled={disabled}
            right={right}
          />
        </TouchableOpacity>
        <TextFieldFooter
          error={error}
          showCounter={showCounter}
          length={valueLength}
          maxLength={maxLength}
          duration={duration}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.6,
  },
  valueMeasurer: {
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
  left: {
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginRight: 8,
  },
  leftTop: {
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  center: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    alignSelf: "stretch",
  },
});
