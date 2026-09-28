import { observer } from "mobx-react-lite";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  INotificationStore,
  NotificationInstance,
  NotificationPosition,
} from "../notification.types";
import { NotificationItem } from "./NotificationItem";

export interface NotificationHostProps {
  /** Дополнительный отступ от верхнего safe-area края. */
  topOffset?: number;
  /** Дополнительный отступ от нижнего safe-area края. */
  bottomOffset?: number;
  /** Глобальный кастомный рендер контента (per-notification `render` приоритетнее). */
  renderContent?: (notification: NotificationInstance) => React.ReactNode;
}

/**
 * Тонкий observer-слой над NotificationStore: рендерит верхний и нижний стеки
 * уведомлений. Монтируется один раз в корне приложения; никакого собственного
 * состояния не имеет, поэтому уведомления, созданные до монтирования,
 * отрисовываются при появлении хоста.
 */
export const NotificationHost = observer<NotificationHostProps>(
  ({ topOffset = 8, bottomOffset = 8, renderContent }) => {
    const store = INotificationStore.useInstance();
    const insets = useSafeAreaInsets();

    const renderStack = (
      position: NotificationPosition,
      style: ViewStyle,
    ): React.ReactNode => {
      const items = store.visible.filter(item => item.position === position);

      if (items.length === 0) {
        return null;
      }

      // Верхний стек: свежие ближе к краю экрана; нижний — естественный порядок.
      const ordered = position === "top" ? [...items].reverse() : items;

      return (
        <View pointerEvents="box-none" style={[styles.stack, style]}>
          {ordered.map(item => (
            <NotificationItem
              key={item.id}
              notification={item}
              renderContent={renderContent}
            />
          ))}
        </View>
      );
    };

    return (
      <>
        {renderStack("top", { top: insets.top + topOffset })}
        {renderStack("bottom", { bottom: insets.bottom + bottomOffset })}
      </>
    );
  },
);

const styles = StyleSheet.create({
  stack: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
    paddingHorizontal: 16,
    gap: 8,
  },
});
