import { useConstant, useLatestRef } from "@shared/lib/hooks";
import { createRef, RefObject, useCallback, useRef, useState } from "react";

import { BottomSheet } from "../BottomSheet";

type TSheetRef = RefObject<BottomSheet | null>;

export type TBottomSheetStackSheetConfig = {
  /** Вызывается при реальном закрытии стека (не при replace-переходе). */
  onDismiss?: () => void;
};

export type TBottomSheetStackConfig<K extends string> = Record<
  K,
  TBottomSheetStackSheetConfig
>;

export type TBottomSheetStackSheetProps = {
  ref: TSheetRef;
  onDismiss: () => void;
};

export interface IBottomSheetStack<K extends string> {
  /** Рефы листов; создаются динамически по ключам конфига. */
  refs: Record<K, TSheetRef>;
  /** Готовые пропсы листа: `<BottomSheet {...sheets.filter} />`. */
  sheets: Record<K, TBottomSheetStackSheetProps>;
  /** Верхний лист стека или `null`, если стек закрыт. */
  activeSheet: K | null;
  isOpen: (key: K) => boolean;
  /** Открывает лист поверх текущего (визуально — replace, история в хуке). */
  present: (key: K) => void;
  /** Возврат к предыдущему листу; для единственного — закрытие. */
  back: () => void;
  /** Закрывает весь стек. */
  dismiss: () => void;
}

/**
 * Стек шторок поверх `stackBehavior: "replace"`: на экране всегда один лист,
 * история переходов хранится в хуке. Свайп-закрытие верхнего листа закрывает
 * весь стек — визуально предыдущих листов уже нет.
 *
 * Закрытие листа асинхронное и непрерываемое: `present` по листу, который ещё
 * доигрывает закрытие, в `@gorhom/bottom-sheet` игнорируется, а сам лист всё
 * равно размонтируется. Поэтому показ такого листа откладывается до его
 * `onDismiss`, а закрытием стека считается только `onDismiss` листа, который
 * на этот момент был на экране.
 */
export const useBottomSheetStack = <K extends string>(
  config: TBottomSheetStackConfig<K>,
): IBottomSheetStack<K> => {
  const configRef = useLatestRef(config);
  const refsStore = useConstant(() => new Map<K, TSheetRef>());
  const propsStore = useConstant(
    () => new Map<K, TBottomSheetStackSheetProps>(),
  );
  const historyRef = useRef<K[]>([]);
  /** Лист, который сейчас на экране. */
  const visibleRef = useRef<K | null>(null);
  /** Листы, чьё закрытие запущено и чей `onDismiss` ещё не пришёл. */
  const closingRef = useConstant(() => new Set<K>());
  /** Лист, показ которого отложен до конца его же закрытия. */
  const pendingPresentRef = useRef<K | null>(null);
  const [activeSheet, setActiveSheet] = useState<K | null>(null);

  const getRef = useCallback(
    (key: K): TSheetRef => {
      let ref = refsStore.get(key);

      if (!ref) {
        ref = createRef<BottomSheet | null>();
        refsStore.set(key, ref);
      }

      return ref;
    },
    [refsStore],
  );

  const show = useCallback(
    (key: K) => {
      if (closingRef.has(key)) {
        pendingPresentRef.current = key;

        return;
      }

      pendingPresentRef.current = null;

      const visible = visibleRef.current;

      // replace закроет текущий лист сам; его `onDismiss` — не закрытие стека
      if (visible && visible !== key) {
        closingRef.add(visible);
      }

      visibleRef.current = key;
      getRef(key).current?.present();
    },
    [closingRef, getRef],
  );

  const closeStack = useCallback(() => {
    pendingPresentRef.current = null;

    const visible = visibleRef.current;

    if (!visible || closingRef.has(visible)) {
      return;
    }

    closingRef.add(visible);
    getRef(visible).current?.dismiss();
  }, [closingRef, getRef]);

  const handleDismiss = useCallback(
    (key: K) => {
      closingRef.delete(key);

      const wasVisible = visibleRef.current === key;

      if (wasVisible) {
        visibleRef.current = null;
      }

      if (pendingPresentRef.current === key) {
        show(key);

        return;
      }

      if (!wasVisible) {
        return;
      }

      const top = historyRef.current.at(-1) ?? key;

      historyRef.current = [];
      setActiveSheet(null);
      configRef.current[top]?.onDismiss?.();
    },
    [closingRef, configRef, show],
  );

  const present = useCallback(
    (key: K) => {
      const history = historyRef.current;

      if (history.at(-1) === key) {
        return;
      }

      historyRef.current = [...history.filter(item => item !== key), key];
      setActiveSheet(key);
      show(key);
    },
    [show],
  );

  const back = useCallback(() => {
    const history = historyRef.current;
    const top = history.at(-1);

    if (!top) {
      return;
    }

    const prev = history.at(-2) ?? null;

    if (!prev) {
      closeStack();

      return;
    }

    // история чистится только по факту закрытия — в `handleDismiss`
    historyRef.current = history.slice(0, -1);
    setActiveSheet(prev);
    show(prev);
  }, [closeStack, show]);

  const dismiss = useCallback(() => {
    if (historyRef.current.length > 0) {
      closeStack();
    }
  }, [closeStack]);

  const isOpen = useCallback((key: K) => historyRef.current.at(-1) === key, []);

  const refs = {} as Record<K, TSheetRef>;
  const sheets = {} as Record<K, TBottomSheetStackSheetProps>;

  for (const key of Object.keys(config) as K[]) {
    let sheetProps = propsStore.get(key);

    if (!sheetProps) {
      sheetProps = { ref: getRef(key), onDismiss: () => handleDismiss(key) };
      propsStore.set(key, sheetProps);
    }

    refs[key] = sheetProps.ref;
    sheets[key] = sheetProps;
  }

  return { refs, sheets, activeSheet, isOpen, present, back, dismiss };
};
