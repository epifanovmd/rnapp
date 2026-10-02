import type { IAnchorListProps } from "@epifanovmd/anchor-list";
import { TAnimatedNumber } from "@shared/lib/animation";
import React, {
  ComponentType,
  createElement,
  isValidElement,
  ReactElement,
  useCallback,
  useMemo,
} from "react";
import Animated, { useAnimatedRef } from "react-native-reanimated";

import { KeyboardAwareContext } from "./keyboard-aware-context";
import { KeyboardAwareAnchor } from "./KeyboardAwareAnchor";
import { KeyboardAwareSpacer } from "./KeyboardAwareSpacer";
import { useKeyboardAwareScroll } from "./useKeyboardAwareScroll";

type TListSlot = ComponentType<unknown> | ReactElement | null | undefined;

export interface IKeyboardAwareAnchorListConfig {
  /** Шапка списка потребителя: якорь встаёт перед ней. */
  ListHeaderComponent?: TListSlot;
  /** Футер списка потребителя: распорка встаёт после него. */
  ListFooterComponent?: TListSlot;
  /** Зазор между низом поля и клавиатурой, px. По умолчанию 16. */
  bottomOffset?: number;
  /** Перекрытие верха списка (прозрачный навбар). */
  topInset?: TAnimatedNumber;
  /**
   * При закрытии клавиатуры вернуть скролл к положению на момент её открытия,
   * если пользователь не скроллил сам. По умолчанию `true`.
   */
  restoreScrollOnKeyboardHide?: boolean;
  enabled?: boolean;
}

/** Пропсы AnchorList, которые подключают поля над клавиатурой. */
export type TKeyboardAwareAnchorListProps = Required<
  Pick<
    IAnchorListProps<unknown>,
    "refScrollView" | "ListHeaderComponent" | "ListFooterComponent"
  >
>;

const renderSlot = (slot: TListSlot) => {
  if (!slot) return null;

  return isValidElement(slot) ? slot : createElement(slot);
};

/**
 * Поля формы над клавиатурой в AnchorList — обвязка `useKeyboardAwareScroll`:
 * ref скролла (с приведением типов link-пакета), якорь в шапке, распорка в
 * футере (после футера потребителя) и реестр полей. `insetEnd` не
 * используется: он сам двигает смещение и спорил бы с докруткой к полю.
 *
 * ```tsx
 * const keyboardAware = useKeyboardAwareAnchorList({ ListFooterComponent: footer });
 *
 * return keyboardAware.wrap(
 *   <AnchorList {...keyboardAware.listProps} data={rows} renderItem={renderRow} />,
 * );
 * ```
 */
export const useKeyboardAwareAnchorList = ({
  ListHeaderComponent,
  ListFooterComponent,
  bottomOffset,
  topInset,
  restoreScrollOnKeyboardHide = true,
  enabled,
}: IKeyboardAwareAnchorListConfig = {}) => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const controller = useKeyboardAwareScroll(scrollRef, {
    bottomOffset,
    topInset,
    enabled,
    restoreOnHide: restoreScrollOnKeyboardHide,
  });

  const listProps = useMemo<TKeyboardAwareAnchorListProps>(
    () => ({
      // У link-пакета своя копия типов reanimated.
      refScrollView:
        scrollRef as unknown as TKeyboardAwareAnchorListProps["refScrollView"],
      ListHeaderComponent: (
        <>
          <KeyboardAwareAnchor controller={controller} />
          {renderSlot(ListHeaderComponent)}
        </>
      ),
      ListFooterComponent: (
        <>
          {renderSlot(ListFooterComponent)}
          <KeyboardAwareSpacer controller={controller} />
        </>
      ),
    }),
    [scrollRef, controller, ListHeaderComponent, ListFooterComponent],
  );

  /** Реестр полей вокруг списка: строки регистрируются в нём. */
  const wrap = useCallback(
    (list: ReactElement) => (
      <KeyboardAwareContext.Provider value={controller.registry}>
        {list}
      </KeyboardAwareContext.Provider>
    ),
    [controller.registry],
  );

  return useMemo(
    () => ({ controller, listProps, wrap }),
    [controller, listProps, wrap],
  );
};
