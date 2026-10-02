import { useEvent } from "@shared/lib/hooks";
import React, { Ref, useMemo, useRef } from "react";
import { TextInput } from "react-native";

import { TextField } from "../input";
import { Text } from "../text";
import { SelectSheet, SelectTrigger } from "./components";
import type { ISelectListModel } from "./components/select-list-model";
import { useSelectEngine } from "./hooks";
import type { AutocompleteProps, SelectRef } from "./types";
import {
  buildOptionRows,
  resolveVirtualConfig,
  SELECT_DEFAULT_MAX_HEIGHT,
  SELECT_EMPTY_TEXT,
  SELECT_ERROR_TEXT,
} from "./utils";

const noop = () => undefined;

/**
 * Ввод текста с подсказками: поле открывает шторку с полем ввода (фокус —
 * когда шторка открылась) и списком подсказок под ним. Ввод сразу меняет
 * значение (`onChange`) и запрос (`onSearch`); выбор подсказки подставляет
 * `option.value` и закрывает шторку, «Готово» на клавиатуре — тоже.
 */
export const Autocomplete = <V extends string = string>({
  ref,
  options,
  loading,
  loadingMore,
  hasMore,
  error,
  onSearch,
  onScrollEnd,
  open,
  onOpenChange,
  disabled,
  placeholder,
  label,
  description,
  errorMessage,
  title,
  maxHeight = SELECT_DEFAULT_MAX_HEIGHT,
  empty,
  errorContent = SELECT_ERROR_TEXT,
  optionRender,
  virtual,
  hideEmpty = true,
  closeOnClear = false,
  onSelect,
  value,
  onChange,
  clearable = true,
  inputProps,
}: AutocompleteProps<V> & { ref?: Ref<SelectRef> }) => {
  const text = value ?? "";
  const inputRef = useRef<TextInput>(null);

  const handleEngineChange = useEvent((next: V | V[] | null) => {
    onChange?.(next == null ? "" : String(next));
  });

  const engine = useSelectEngine<V>({
    ref,
    options,
    multi: false,
    value: text === "" ? null : (text as V),
    onChange: handleEngineChange,
    onSelect,
    open,
    onOpenChange,
    closeOnClear,
  });

  const handleChangeText = useEvent((next: string) => {
    onSearch?.(next);
    onChange?.(next);
  });

  const rows = useMemo(() => buildOptionRows({ options }), [options]);
  const virtualConfig = useMemo(
    () => resolveVirtualConfig(virtual, options.length),
    [virtual, options.length],
  );

  const model: ISelectListModel<V> = {
    rows,
    multi: false,
    loading,
    loadingMore,
    hasMore,
    error,
    empty: hideEmpty ? null : (empty ?? SELECT_EMPTY_TEXT),
    errorContent,
    optionRender,
    isSelected: engine.isSelected,
    onSelect: engine.select,
    onClear: engine.clear,
    onCreate: noop,
    onScrollEnd,
    scrollToIndexRef: engine.scrollToIndexRef,
    virtual: virtualConfig,
  };

  return (
    <>
      <SelectTrigger
        label={label}
        description={description}
        errorMessage={errorMessage}
        disabled={disabled}
        loading={loading}
        showClear={clearable && !loading && !disabled && text !== ""}
        showChevron={false}
        onClear={engine.clear}
        onPress={() => engine.handleOpen(true)}
      >
        <Text
          textStyle={"Body_M2"}
          color={text ? "textPrimary" : "textTertiary"}
          numberOfLines={1}
        >
          {text || placeholder}
        </Text>
      </SelectTrigger>
      <SelectSheet<V>
        visible={engine.open}
        onUserDismiss={engine.close}
        onOpened={() => inputRef.current?.focus()}
        title={title ?? label}
        top={
          <TextField
            ref={inputRef}
            size={"small"}
            returnKeyType={"done"}
            {...inputProps}
            placeholder={placeholder}
            value={text}
            clearable={clearable}
            onChangeText={handleChangeText}
            onSubmitEditing={engine.close}
          />
        }
        model={model}
        maxHeight={maxHeight}
      />
    </>
  );
};
