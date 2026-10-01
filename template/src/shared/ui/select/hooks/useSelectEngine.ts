import { useControllableState, useEvent } from "@shared/lib/hooks";
import {
  Ref,
  RefObject,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

import type { SelectOption, SelectRef, SelectValue } from "../types";

export interface UseSelectEngineOptions<V extends SelectValue> {
  ref?: Ref<SelectRef>;
  options: SelectOption<V>[];
  multi?: boolean;
  value: V | V[] | null | undefined;
  onChange?: (value: V | V[] | null) => void;
  onSelect?: (value: V, option: SelectOption<V>) => void;
  onDeselect?: (value: V, option: SelectOption<V>) => void;
  /** Управляемое открытие. */
  open?: boolean;
  /** Вызывается при любой смене open, включая программное закрытие. */
  onOpenChange?: (open: boolean) => void;
  /** Закрывать шторку при очистке значения (по умолчанию true). */
  closeOnClear?: boolean;
  /** Сброс строки поиска при закрытии шторки. */
  onSearchReset?: () => void;
}

export interface UseSelectEngineResult<V extends SelectValue> {
  open: boolean;
  handleOpen: (nextOpen: boolean) => void;
  close: () => void;
  selectedValues: V[];
  isSelected: (value: V) => boolean;
  hasValue: boolean;
  /** single — выбрать и закрыть; multi — переключить, шторка остаётся. */
  select: (value: V) => void;
  clear: () => void;
  removeTag: (value: V) => void;
  /** Сюда список регистрирует прокрутку к опции (ref-API `scrollTo`). */
  scrollToIndexRef: RefObject<((index: number) => void) | null>;
}

const isEmptyValue = (value: unknown): boolean => value == null || value === "";

/**
 * Headless-ядро выбора: состояние шторки, выбор/снятие значения, события
 * `onSelect`/`onDeselect` и ref-API. Варианты (Select, Autocomplete)
 * подключают к нему своё представление.
 */
export const useSelectEngine = <V extends SelectValue>({
  ref,
  options,
  multi = false,
  value,
  onChange,
  onSelect,
  onDeselect,
  open: openProp,
  onOpenChange,
  closeOnClear = true,
  onSearchReset,
}: UseSelectEngineOptions<V>): UseSelectEngineResult<V> => {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: false,
    onChange: onOpenChange,
  });

  const selectedValues = useMemo<V[]>(() => {
    if (multi) return (value as V[] | undefined) ?? [];

    return isEmptyValue(value) ? [] : [value as V];
  }, [multi, value]);

  const isSelected = useCallback(
    (item: V) => selectedValues.includes(item),
    [selectedValues],
  );

  const handleOpen = useEvent((nextOpen: boolean) => {
    if (open === nextOpen) return;
    setOpen(nextOpen);
    if (!nextOpen) onSearchReset?.();
  });

  const close = useCallback(() => handleOpen(false), [handleOpen]);

  const findOption = useEvent((item: V) =>
    options.find(option => option.value === item),
  );

  const select = useEvent((item: V) => {
    const option = findOption(item);
    const wasSelected = selectedValues.includes(item);

    if (multi) {
      onChange?.(
        wasSelected
          ? selectedValues.filter(selected => selected !== item)
          : [...selectedValues, item],
      );
    } else {
      onChange?.(item);
      close();
    }

    if (!option) return;
    if (multi && wasSelected) onDeselect?.(item, option);
    else onSelect?.(item, option);
  });

  const clear = useEvent(() => {
    selectedValues.forEach(item => {
      const option = findOption(item);

      if (option) onDeselect?.(item, option);
    });
    onChange?.(multi ? [] : null);
    if (closeOnClear) close();
  });

  const removeTag = useEvent((item: V) => {
    if (!multi) return;
    const option = findOption(item);

    if (option) onDeselect?.(item, option);
    onChange?.(selectedValues.filter(selected => selected !== item));
  });

  const scrollToIndexRef = useRef<((index: number) => void) | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      open: (nextOpen = true) => handleOpen(nextOpen),
      scrollTo: (index: number) => scrollToIndexRef.current?.(index),
    }),
    [handleOpen],
  );

  return {
    open,
    handleOpen,
    close,
    selectedValues,
    isSelected,
    hasValue: selectedValues.length > 0,
    select,
    clear,
    removeTag,
    scrollToIndexRef,
  };
};
