import { useControllableState, useEvent } from "@shared/lib/hooks";
import React, { Ref, useMemo } from "react";

import { TextField } from "../input";
import { SelectSheet, SelectTrigger, SelectTriggerValue } from "./components";
import type { ISelectListModel } from "./components/select-list-model";
import { useCreatableOption, useLabelCache, useSelectEngine } from "./hooks";
import { filterByLabel } from "./strategies/filter-by-label";
import type {
  SelectMultiDisplayProps,
  SelectProps,
  SelectRef,
  SelectValue,
} from "./types";
import {
  buildOptionRows,
  defaultCreateLabel,
  type RawSelectValue,
  resolveVirtualConfig,
  SELECT_DEFAULT_MAX_HEIGHT,
  SELECT_DEFAULT_PLACEHOLDER,
  SELECT_EMPTY_TEXT,
  SELECT_ERROR_TEXT,
  SELECT_NOT_FOUND_TEXT,
  toLabeledArray,
  unwrapLabeled,
} from "./utils";

/**
 * Выбор из списка: поле открывает шторку (поверх родительской) со списком,
 * поиском и отметкой выбранного. Режимы — single / clearable / labelInValue /
 * multi (теги в поле, «Готово» в шторке); опции — напрямую или стратегией
 * (`useStaticOptions`, `useAsyncOptions`, `useInfiniteOptions`, ...).
 */
export const Select = <V extends SelectValue = string>(
  props: SelectProps<V> & { ref?: Ref<SelectRef> },
) => {
  const {
    ref,
    options,
    groups,
    loading,
    loadingMore,
    hasMore,
    error,
    search = false,
    searchValue,
    onSearch,
    onScrollEnd,
    open: openProp,
    onOpenChange,
    disabled,
    placeholder = SELECT_DEFAULT_PLACEHOLDER,
    label,
    description,
    errorMessage,
    title,
    maxHeight = SELECT_DEFAULT_MAX_HEIGHT,
    empty,
    errorContent = SELECT_ERROR_TEXT,
    optionRender,
    renderValue,
    tagRender,
    hideEmpty,
    closeOnClear,
    filterOption,
    creatable = false,
    onCreate,
    createLabel = defaultCreateLabel,
    virtual,
    onSelect,
    onDeselect,
  } = props;

  const multi = props.multi === true;
  const clearable = props.clearable === true;
  const labelInValue = props.labelInValue === true;
  const display = props as SelectMultiDisplayProps;
  const tagsDisplay = multi && display.tagsDisplay !== false;
  const maxTagCount = multi ? display.maxTagCount : undefined;
  const rawValue = props.value as RawSelectValue<V>;
  const rawOnChange = props.onChange as ((value: unknown) => void) | undefined;

  const [query, setQuery] = useControllableState({
    value: searchValue,
    defaultValue: "",
    onChange: onSearch,
  });

  const filtering = search && (filterOption ?? !onSearch) !== false;
  const predicate =
    typeof filterOption === "function" ? filterOption : undefined;
  const visibleOptions = useMemo(
    () => (filtering ? filterByLabel(options, query, predicate) : options),
    [filtering, options, query, predicate],
  );

  const { getLabel, toLabeled } = useLabelCache<V>(
    options,
    labelInValue ? toLabeledArray(rawValue) : undefined,
  );

  const resolvedValue = useMemo(
    () => unwrapLabeled(rawValue, labelInValue),
    [rawValue, labelInValue],
  );

  const handleChange = useEvent((next: V | V[] | null) => {
    if (!labelInValue) {
      rawOnChange?.(next);
    } else if (Array.isArray(next)) {
      rawOnChange?.(next.map(toLabeled));
    } else {
      rawOnChange?.(next == null ? null : toLabeled(next));
    }
  });

  const resetQuery = useEvent(() => setQuery(""));

  const engine = useSelectEngine<V>({
    ref,
    options,
    multi,
    value: resolvedValue,
    onChange: handleChange,
    onSelect,
    onDeselect,
    open: openProp,
    onOpenChange,
    closeOnClear,
    onSearchReset: resetQuery,
  });

  // Созданное значение выбирается, но не переключается: в multi повторное
  // создание уже выбранного не должно его снимать.
  const { showCreate, createQuery, create } = useCreatableOption<V>({
    enabled: creatable && search,
    query,
    options,
    blocked: !!loading || !!error,
    onCreate,
    onCreated: value => {
      if (!engine.isSelected(value)) engine.select(value);
      else if (!multi) engine.close();
      resetQuery();
    },
  });

  const rows = useMemo(
    () =>
      buildOptionRows({
        options: visibleOptions,
        groups,
        withClear: clearable && !multi && query === "",
        withCreate: showCreate,
      }),
    [visibleOptions, groups, clearable, multi, query, showCreate],
  );

  const virtualConfig = useMemo(
    () => resolveVirtualConfig(virtual, options.length),
    [virtual, options.length],
  );

  const model: ISelectListModel<V> = {
    rows,
    multi,
    loading,
    loadingMore,
    hasMore,
    error,
    empty:
      hideEmpty && search
        ? null
        : (empty ?? (query ? SELECT_NOT_FOUND_TEXT : SELECT_EMPTY_TEXT)),
    errorContent,
    optionRender,
    isSelected: engine.isSelected,
    clearLabel: placeholder,
    clearActive: !engine.hasValue,
    createContent: showCreate ? createLabel(createQuery) : undefined,
    onSelect: engine.select,
    onClear: engine.clear,
    onCreate: create,
    onScrollEnd,
    scrollToIndexRef: engine.scrollToIndexRef,
    virtual: virtualConfig,
  };

  const hidden =
    !!hideEmpty && !search && !loading && !error && options.length === 0;
  const showClear = clearable && !loading && !disabled && engine.hasValue;

  return (
    <>
      <SelectTrigger
        label={label}
        description={description}
        errorMessage={errorMessage}
        disabled={disabled}
        loading={loading}
        showClear={showClear}
        onClear={engine.clear}
        onPress={() => engine.handleOpen(true)}
      >
        <SelectTriggerValue<V>
          tags={tagsDisplay}
          placeholder={placeholder}
          disabled={disabled}
          values={engine.selectedValues}
          labels={engine.selectedValues.map(getLabel)}
          renderValue={renderValue}
          tagRender={tagRender}
          maxTagCount={maxTagCount}
          onRemoveTag={engine.removeTag}
        />
      </SelectTrigger>
      <SelectSheet<V>
        visible={engine.open && !hidden}
        onUserDismiss={engine.close}
        title={title ?? label}
        top={
          search ? (
            <TextField
              size={"small"}
              iconName={"search"}
              placeholder={"Поиск"}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              clearable
            />
          ) : undefined
        }
        model={model}
        onDone={multi ? engine.close : undefined}
        onClearAll={
          multi && clearable && engine.hasValue ? engine.clear : undefined
        }
        maxHeight={maxHeight}
      />
    </>
  );
};
