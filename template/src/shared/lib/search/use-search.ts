import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Keyboard, TextInput } from "react-native";
import {
  Easing,
  SharedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useDebouncedValue } from "../hooks/use-debounced-value";
import { shouldCloseOnBlur } from "./search-blur";

export interface IUseSearchOptions {
  /** Задержка `debouncedQuery` после ввода, мс. По умолчанию 250. */
  debounceMs?: number;
  /** Длительность раскрытия и сворачивания поля, мс. По умолчанию 280. */
  duration?: number;
  /** Системная «назад» (Android) закрывает поиск. По умолчанию `true`. */
  closeOnBack?: boolean;
  /** Потеря фокуса без запроса закрывает поиск. По умолчанию `true`. */
  closeOnEmptyBlur?: boolean;
  /** Поиск открыт / закрыт. */
  onActiveChange?: (active: boolean) => void;
}

/**
 * Поиск экрана: запрос, отложенный запрос для фильтрации/сети, режим поиска
 * и прогресс раскрытия поля (UI-поток). Поле и кнопку рисует UI
 * (`NavbarSearchField`, `NavbarSearchButton`), содержимое экрана выбирает по
 * `active` и `debouncedQuery`.
 */
export interface ISearchController {
  query: string;
  /** Запрос после паузы ввода — для фильтрации и запросов в сеть. */
  debouncedQuery: string;
  /** Режим поиска: поле раскрыто. */
  active: boolean;
  /** 0 — поле свёрнуто, 1 — раскрыто. */
  progress: SharedValue<number>;
  /** `active` на UI-потоке — для поведений (шапка, скролл). */
  activeValue: SharedValue<boolean>;
  inputRef: RefObject<TextInput | null>;
  setQuery: (query: string) => void;
  /** Режим поиска; фокус ставит поле (`autoFocus`), когда раскрытие уже идёт. */
  open: () => void;
  /** Свернуть поле, очистить запрос, убрать клавиатуру. */
  close: () => void;
  /** Очистить запрос, оставить поиск открытым. */
  clear: () => void;
  /** Поле потеряло фокус: без запроса — закрыть поиск (`closeOnEmptyBlur`). */
  blur: () => void;
}

const EASING = Easing.bezier(0.2, 0.8, 0.2, 1);

/** Контроллер поиска экрана. */
export const useSearch = ({
  debounceMs = 250,
  duration = 280,
  closeOnBack = true,
  closeOnEmptyBlur = true,
  onActiveChange,
}: IUseSearchOptions = {}): ISearchController => {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(false);
  const debouncedQuery = useDebouncedValue(query, debounceMs);
  const progress = useSharedValue(0);
  const activeValue = useSharedValue(false);
  const activeRef = useRef(false);
  const inputRef = useRef<TextInput | null>(null);
  const onActiveChangeRef = useRef(onActiveChange);

  onActiveChangeRef.current = onActiveChange;

  const animate = useCallback(
    (target: number) => {
      progress.value = withTiming(target, { duration, easing: EASING });
    },
    [progress, duration],
  );

  const setActiveState = useCallback(
    (next: boolean) => {
      activeRef.current = next;
      activeValue.value = next;
      setActive(next);
      onActiveChangeRef.current?.(next);
      animate(next ? 1 : 0);
    },
    [activeValue, animate],
  );

  const open = useCallback(() => {
    if (!activeRef.current) setActiveState(true);
  }, [setActiveState]);

  const close = useCallback(() => {
    inputRef.current?.blur();
    Keyboard.dismiss();
    setQuery("");
    if (activeRef.current) setActiveState(false);
  }, [setActiveState]);

  const queryRef = useRef(query);

  queryRef.current = query;

  const blur = useCallback(() => {
    if (
      activeRef.current &&
      shouldCloseOnBlur(queryRef.current, closeOnEmptyBlur)
    ) {
      close();
    }
  }, [closeOnEmptyBlur, close]);

  const clear = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!active || !closeOnBack) return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        close();

        return true;
      },
    );

    return () => subscription.remove();
  }, [active, closeOnBack, close]);

  return useMemo(
    () => ({
      query,
      debouncedQuery: query ? debouncedQuery : "",
      active,
      progress,
      activeValue,
      inputRef,
      setQuery,
      open,
      close,
      clear,
      blur,
    }),
    [
      query,
      debouncedQuery,
      active,
      progress,
      activeValue,
      open,
      close,
      clear,
      blur,
    ],
  );
};
