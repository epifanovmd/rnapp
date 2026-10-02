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
import { searchTrailingLayout } from "./search-trailing-layout";

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
  /**
   * Справа от поля вне режима поиска (например, «добавить»). В режиме
   * `cancel="active"` сменяется «Отменой» на том же месте.
   */
  accessory: slot.of(View),
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
  const {
    query,
    setQuery,
    clear,
    close,
    open,
    blur,
    inputRef,
    active,
    progress,
  } = search;
  const [cancelWidth, setCancelWidth] = useState(0);
  const [accessoryWidth, setAccessoryWidth] = useState(0);

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

  const onAccessoryLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;

    setAccessoryWidth(previous => (previous === next ? previous : next));
  }, []);

  const { leading, trailing, cancel, accessory } = slots;
  const accessoryOffset = accessory.present ? accessoryWidth : 0;

  // Зона справа в режиме "active": аксессуар и «Отмена» сменяются на одном
  // месте у правого края, ширина зоны переходит от одного к другому.
  const zoneStyle = useAnimatedStyle(
    () => ({
      width: searchTrailingLayout(progress.value, accessoryOffset, cancelWidth)
        .width,
    }),
    [accessoryOffset, cancelWidth, progress],
  );
  const accessoryStyle = useAnimatedStyle(
    () => ({
      opacity: searchTrailingLayout(progress.value, accessoryOffset, cancelWidth)
        .accessoryOpacity,
    }),
    [accessoryOffset, cancelWidth, progress],
  );
  const cancelStyle = useAnimatedStyle(
    () => ({
      opacity: searchTrailingLayout(progress.value, accessoryOffset, cancelWidth)
        .cancelOpacity,
    }),
    [accessoryOffset, cancelWidth, progress],
  );

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
          onBlur={blur}
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
      {cancelMode !== "active" && accessory.present && (
        <View style={styles.trailingStatic}>{accessory.render()}</View>
      )}
      {cancelMode === "always" && (
        <View style={styles.trailingStatic}>{cancelContent}</View>
      )}
      {cancelMode === "active" && (
        <>
          <Animated.View style={[styles.zone, zoneStyle]}>
            {accessory.present && (
              <Animated.View
                style={[
                  styles.zoneItem,
                  accessoryWidth > 0 && { width: accessoryWidth },
                  accessoryStyle,
                ]}
                pointerEvents={active ? "none" : "box-none"}
              >
                {accessory.render()}
              </Animated.View>
            )}
            <Animated.View
              style={[
                styles.zoneItem,
                cancelWidth > 0 && { width: cancelWidth },
                cancelStyle,
              ]}
              pointerEvents={active ? "box-none" : "none"}
            >
              {cancelContent}
            </Animated.View>
          </Animated.View>
          {/* Замер по всей ширине строки: в анимируемой зоне содержимое сжато. */}
          <View
            style={styles.measure}
            pointerEvents={"none"}
            accessibilityElementsHidden
            importantForAccessibility={"no-hide-descendants"}
            onLayout={onCancelLayout}
          >
            {cancelContent}
          </View>
          {accessory.present && (
            <View
              style={styles.measure}
              pointerEvents={"none"}
              accessibilityElementsHidden
              importantForAccessibility={"no-hide-descendants"}
              onLayout={onAccessoryLayout}
            >
              {accessory.render()}
            </View>
          )}
        </>
      )}
    </View>
  );
};

/**
 * Строка поиска на контроллере `useSearch`: поле с лупой и «очистить»,
 * «Отмена». Тап в поле открывает поиск; при открытии извне — фокус сам
 * (`autoFocus`); потеря фокуса без запроса закрывает поиск. Слоты `Leading`/`Trailing`/`Cancel` заменяют части,
 * `Accessory` — кнопка справа от поля вне поиска, на её место встаёт «Отмена».
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
  zone: {
    alignSelf: "stretch",
    overflow: "hidden",
  },
  // Ширина — измеренная: содержимое не сжимается вместе с зоной, а стоит у
  // правого края целиком.
  zoneItem: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingLeft: 12,
  },
  measure: {
    position: "absolute",
    right: 0,
    opacity: 0,
    paddingLeft: 12,
  },
  trailingStatic: {
    paddingLeft: 12,
  },
});
