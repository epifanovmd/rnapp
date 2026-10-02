import { useMergedCallback } from "@shared/lib/hooks";
import { mergeRefs } from "@shared/lib/hooks/merge-refs";
import { useKeyboardAwareField } from "@shared/lib/keyboard-aware";
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
import { resolveTextFieldMode } from "./text-field-mode";

export interface ITextFieldProps extends Omit<TextInputProps, "style"> {
  readonly label?: string;
  readonly error?: string | boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly iconName?: TIconName;
  readonly iconColor?: string;
  /** Короткий суффикс в строке ввода после текста (единицы: «мс», «/24»). */
  readonly hint?: string;
  /** Пояснение под полем на всю ширину; при ошибке её текст показывается вместо него. */
  readonly description?: string;
  readonly hintPosition?: "left" | "right";
  readonly clearable?: boolean;
  /**
   * `small` — компактное поле (44 px) для строки поиска и фильтров: без
   * плавающего label, с placeholder.
   */
  readonly size?: "medium" | "small";
  readonly showSymbolCount?: boolean;
  readonly duration?: number;
  /** Произвольный контент слева (после iconName). */
  readonly left?: React.ReactNode;
  /** Произвольный контент справа (до системных иконок). */
  readonly right?: React.ReactNode;
  /**
   * Поле-триггер: нажатие по плашке вызывает `onPress` (открыть пикер,
   * шторку) вместо фокуса, ввод с клавиатуры выключен, вид — не disabled.
   */
  readonly onPress?: () => void;
  /** Сброс по крестику (`clearable`); без него — `onChangeText("")`. */
  readonly onClear?: () => void;
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
      description,
      hintPosition = "right",
      clearable,
      size = "medium",
      maxLength,
      showSymbolCount,
      duration = ANIMATION_DURATION,
      multiline,
      numberOfLines = multiline ? 6 : 1,
      onFocus,
      onBlur,
      onChangeText,
      onLayout,
      onContentSizeChange,
      editable,
      secureTextEntry,
      left,
      right,
      onPress,
      onClear,
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

    const keyboardAware = useKeyboardAwareField(inputRef);

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

    const showError = !!error;
    const { isTrigger, disabled, inputEditable, showClear } =
      resolveTextFieldMode({
        triggerable: !!onPress,
        editable,
        clearable,
        hasValue,
        hasError: showError,
      });
    const active = isFocused || hasValue;
    const labelActive = active && !!label;
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
    const handleContentSizeChange = useMergedCallback(
      onContentSizeChange,
      keyboardAware.onContentSizeChange,
    );

    return (
      <Animated.View
        ref={keyboardAware.containerRef}
        collapsable={false}
        onLayout={keyboardAware.onLayout}
        style={[style, disabled && styles.disabled]}
      >
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
          activeOpacity={isTrigger ? 0.7 : 1}
          onPress={isTrigger ? onPress : focusInput}
          accessibilityRole={isTrigger ? "button" : undefined}
          accessibilityLabel={isTrigger ? label : undefined}
          style={[
            styles.wrap,
            size === "small" && styles.wrapSmall,
            { backgroundColor: colors.onSurface },
          ]}
        >
          {(!!iconName || !!left) && (
            <View style={[styles.left, multiline && styles.leftTop]}>
              {!!iconName && (
                <Icon
                  color={iconColor ?? colors.textTertiary}
                  name={iconName}
                  size={size === "small" ? 20 : undefined}
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
                onContentSizeChange={handleContentSizeChange}
                editable={inputEditable}
                pointerEvents={isTrigger ? "none" : undefined}
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
            onClear={onClear ?? handleClear}
            showError={showError}
            disabled={disabled}
            right={right}
          />
        </TouchableOpacity>
        {!!description && !showError && (
          <RNText
            style={[
              styles.description,
              getTextStyle("Caption_M3"),
              { color: colors.textSecondary },
            ]}
          >
            {description}
          </RNText>
        )}
        <TextFieldFooter
          error={error}
          showCounter={showCounter}
          length={valueLength}
          maxLength={maxLength}
          duration={duration}
        />
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.6,
  },
  description: {
    marginTop: 4,
    paddingHorizontal: 16,
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
  wrapSmall: {
    minHeight: 44,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
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
