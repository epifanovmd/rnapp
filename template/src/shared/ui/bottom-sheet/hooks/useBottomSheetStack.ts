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

  const handleDismiss = useCallback(
    (key: K) => {
      if (historyRef.current.at(-1) !== key) {
        return;
      }

      historyRef.current = [];
      setActiveSheet(null);
      configRef.current[key]?.onDismiss?.();
    },
    [configRef],
  );

  const present = useCallback(
    (key: K) => {
      const history = historyRef.current;

      if (history.at(-1) === key) {
        return;
      }

      historyRef.current = [...history.filter(item => item !== key), key];
      getRef(key).current?.present();
      setActiveSheet(key);
    },
    [getRef],
  );

  const back = useCallback(() => {
    const history = historyRef.current;
    const top = history.at(-1);

    if (!top) {
      return;
    }

    historyRef.current = history.slice(0, -1);

    const prev = historyRef.current.at(-1) ?? null;

    if (prev) {
      getRef(prev).current?.present();
      setActiveSheet(prev);
    } else {
      getRef(top).current?.dismiss();
    }
  }, [getRef]);

  const dismiss = useCallback(() => {
    const top = historyRef.current.at(-1);

    if (top) {
      getRef(top).current?.dismiss();
    }
  }, [getRef]);

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
