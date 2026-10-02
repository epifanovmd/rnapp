import type { ISearchController } from "@shared/lib/search";
import { useTheme } from "@shared/lib/theme";
import React, { useCallback, useEffect, useState } from "react";
import {
  LayoutChangeEvent,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
} from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";
import { Icon } from "../icon";
import { getTextStyle, Text } from "../text";
import { Touchable } from "../touchable";

/** Когда показывать «Отмену»: в режиме поиска, всегда или никогда. */
export type TSearchCancelMode = "active" | "always" | "never";

export interface ISearchBarProps
  extends
    ViewProps,
    Pick<
      TextInputProps,
      "autoCapitalize" | "autoCorrect" | "keyboardType" | "returnKeyType"
    > {
  search: ISearchController;
  placeholder?: string;
  /** Текст «Отмены». По умолчанию «Отмена». */
  cancelText?: string;
  /** Когда показывать «Отмену». По умолчанию `"active"`. */
  cancel?: TSearchCancelMode;
  /** Фокус при открытии поиска (не по тапу в поле). По умолчанию `true`. */
  autoFocus?: boolean;
  /** Задержка фокуса после открытия, мс: поле успевает раскрыться. По умолчанию 60. */
  focusDelay?: number;
  /** «Найти» на клавиатуре. */
  onSubmit?: (query: string) => void;
}

const searchBarSlots = {
  /** Слева в поле; по умолчанию — лупа. */
  leading: slot.of(View),
  /** Справа в поле; по умолчанию — «очистить», пока есть запрос. */
  trailing: slot.of(View),
  /** Вместо кнопки «Отмена». */
  cancel: slot.of(View),
};

const INPUT_TEXT_STYLE = getTextStyle("Body_M1");

const SearchBarRoot = ({
  props,
  slots,
}: CompoundRootProps<ISearchBarProps, typeof searchBarSlots>) => {
  const {
    search,
    placeholder = "Поиск",
    cancelText = "Отмена",
    cancel: cancelMode = "active",
    autoFocus = true,
    focusDelay = 60,
    onSubmit,
    autoCapitalize = "none",
    autoCorrect = false,
    keyboardType,
    returnKeyType = "search",
    style,
    ...rest
  } = props;
  const { colors } = useTheme();
  const { query, setQuery, clear, close, open, inputRef, active, progress } =
    search;
  const [cancelWidth, setCancelWidth] = useState(0);

  // Фокус — когда поле уже раскрывается: в нулевую ширину iOS его не ставит.
  useEffect(() => {
    if (!active || !autoFocus || inputRef.current?.isFocused()) return;

    const timer = setTimeout(() => inputRef.current?.focus(), focusDelay);

    return () => clearTimeout(timer);
  }, [active, autoFocus, focusDelay, inputRef]);

  const onCancelLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;

    setCancelWidth(previous => (previous === next ? previous : next));
  }, []);

  // «Отмена» в режиме "active" выезжает справа, отнимая ширину у поля.
  const cancelStyle = useAnimatedStyle(() => {
    if (cancelMode !== "active") return {};

    return {
      width: cancelWidth * progress.value,
      opacity: progress.value,
    };
  }, [cancelMode, cancelWidth, progress]);

  const { leading, trailing, cancel } = slots;

  const cancelContent = cancel.present ? (
    cancel.render()
  ) : (
    <Touchable onPress={close} hitSlop={8} accessibilityRole={"button"}>
      <Text textStyle={"Body_M1"} color={"primary"} numberOfLines={1}>
        {cancelText}
      </Text>
    </Touchable>
  );

  return (
    <View style={[styles.row, style]} {...rest}>
      <View style={[styles.pill, { backgroundColor: colors.onSurface }]}>
        {leading.present ? (
          leading.render()
        ) : (
          <Icon name={"search"} size={18} color={colors.textTertiary} />
        )}
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          onFocus={open}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={() => onSubmit?.(query)}
          style={[styles.input, INPUT_TEXT_STYLE, { color: colors.textPrimary }]}
        />
        {trailing.present
          ? trailing.render()
          : !!query && (
              <Touchable
                onPress={clear}
                hitSlop={8}
                accessibilityRole={"button"}
                accessibilityLabel={"Очистить"}
              >
                <Icon
                  name={"closeCircle"}
                  size={18}
                  color={colors.textTertiary}
                />
              </Touchable>
            )}
      </View>
      {cancelMode === "always" && (
        <View style={styles.cancelStatic}>{cancelContent}</View>
      )}
      {cancelMode === "active" && (
        <>
          <Animated.View style={[styles.cancel, cancelStyle]}>
            <View
              style={[
                styles.cancelContent,
                cancelWidth > 0 && { width: cancelWidth },
              ]}
            >
              {cancelContent}
            </View>
          </Animated.View>
          {/* Замер по всей ширине строки: в анимируемой обёртке текст сжат. */}
          <View
            style={styles.cancelMeasure}
            pointerEvents={"none"}
            accessibilityElementsHidden
            importantForAccessibility={"no-hide-descendants"}
            onLayout={onCancelLayout}
          >
            {cancelContent}
          </View>
        </>
      )}
    </View>
  );
};

/**
 * Строка поиска на контроллере `useSearch`: поле с лупой и «очистить»,
 * «Отмена». Тап в поле открывает поиск; при открытии извне — фокус сам
 * (`autoFocus`). Слоты `Leading`/`Trailing`/`Cancel` заменяют части.
 */
export const SearchBar = createCompound<ISearchBarProps>()({
  name: "SearchBar",
  render: SearchBarRoot,
  slots: searchBarSlots,
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  pill: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  cancel: {
    alignSelf: "stretch",
    justifyContent: "center",
    overflow: "hidden",
  },
  // Ширина — измеренная: содержимое не сжимается вместе с обёрткой, а
  // выезжает справа целиком.
  cancelContent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    justifyContent: "center",
    paddingLeft: 12,
  },
  cancelMeasure: {
    position: "absolute",
    right: 0,
    opacity: 0,
    paddingLeft: 12,
  },
  cancelStatic: {
    paddingLeft: 12,
  },
});
