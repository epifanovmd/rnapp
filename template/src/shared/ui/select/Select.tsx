import { useTheme } from "@shared/lib/theme";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet } from "react-native";

import { BottomSheet, useBottomSheetRef } from "../bottom-sheet";
import { Col } from "../flex-view";
import { Icon } from "../icon";
import { TextField } from "../input";
import { Spinner } from "../spinner";
import { Text } from "../text";
import { Touchable } from "../touchable";
import { filterOptions, optionText } from "./select-utils";
import { SelectRow } from "./SelectRow";
import { ISelectProps, SelectValue } from "./types";

const SEARCH_THRESHOLD = 8;

/** Выбор одного варианта: поле открывает шторку со списком (и поиском). */
export const Select = <V extends SelectValue = string>({
  options,
  value,
  onChange,
  onClose,
  label,
  placeholder = "Не выбрано",
  description,
  error,
  clearable,
  disabled,
  loading,
  searchable,
  title,
}: ISelectProps<V>) => {
  const { colors } = useTheme();
  const sheetRef = useBottomSheetRef();
  const [query, setQuery] = useState("");

  const selected = options.find(option => option.value === value);
  const showSearch = searchable ?? options.length > SEARCH_THRESHOLD;
  const visible = useMemo(
    () => filterOptions(options, query),
    [options, query],
  );

  const open = useCallback(() => {
    setQuery("");
    sheetRef.current?.present();
  }, [sheetRef]);

  const pick = useCallback(
    (next: V | null) => {
      onChange?.(next);
      sheetRef.current?.dismiss();
    },
    [onChange, sheetRef],
  );

  return (
    <Col gap={4}>
      <Touchable
        disabled={disabled}
        onPress={open}
        style={[
          styles.field,
          { backgroundColor: colors.onSurface },
          !!error && { borderColor: colors.danger },
          disabled && styles.disabled,
        ]}
        accessibilityRole={"button"}
        accessibilityLabel={label}
      >
        <Col flex={1} gap={2}>
          {!!label && (
            <Text textStyle={"Caption_M3"} color={"textSecondary"}>
              {label}
            </Text>
          )}
          <Text
            textStyle={"Body_M2"}
            color={selected ? "textPrimary" : "textTertiary"}
            numberOfLines={1}
          >
            {selected ? optionText(selected) : placeholder}
          </Text>
        </Col>
        {loading ? (
          <Spinner size={18} />
        ) : (
          <Icon name={"chevronDown"} size={20} color={colors.textTertiary} />
        )}
      </Touchable>
      {!!(error || description) && (
        <Text
          textStyle={"Caption_M3"}
          color={error ? "danger" : "textSecondary"}
          mh={16}
        >
          {error || description}
        </Text>
      )}

      <BottomSheet
        ref={sheetRef}
        nested
        maxDynamicContentSize={560}
        onDismiss={onClose}
      >
        <BottomSheet.Header label={title ?? label ?? "Выберите"} />
        <BottomSheet.Content>
          <Col gap={4} pb={8}>
            {showSearch && (
              <TextField
                label={"Поиск"}
                iconName={"search"}
                value={query}
                onChangeText={setQuery}
                clearable
              />
            )}
            {clearable && !query && (
              <SelectRow
                text={placeholder}
                muted
                active={value == null}
                onPress={() => pick(null)}
              />
            )}
            {visible.map(option => (
              <SelectRow
                key={String(option.value)}
                text={optionText(option)}
                description={option.description}
                disabled={option.disabled}
                active={option.value === value}
                onPress={() => pick(option.value)}
              />
            ))}
            {!visible.length && (
              <Text color={"textSecondary"} textAlign={"center"} pv={16}>
                {loading ? "Загрузка…" : "Ничего не найдено"}
              </Text>
            )}
          </Col>
        </BottomSheet.Content>
      </BottomSheet>
    </Col>
  );
};

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
});
