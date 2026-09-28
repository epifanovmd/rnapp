import { Spinner } from "@shared/ui/spinner";
import React, { FC, memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { TColorTheme, useTheme } from "../../theme";
import {
  NotificationInstance,
  NotificationVariant,
} from "../notification.types";

export interface NotificationContentProps {
  notification: NotificationInstance;
  /** Нажатие на action-кнопку (закрытие обрабатывает NotificationItem). */
  onActionPress?: () => void;
}

const VARIANT_GLYPH: Record<Exclude<NotificationVariant, "loading">, string> = {
  info: "i",
  success: "✓",
  warning: "!",
  error: "✕",
};

const accentColor = (
  variant: NotificationVariant,
  colors: TColorTheme,
): string => {
  switch (variant) {
    case "success":
      return colors.success;
    case "warning":
      return colors.warning;
    case "error":
      return colors.danger;
    default:
      return colors.info;
  }
};

/** Дефолтный визуал уведомления: иконка варианта, title/message, action-кнопка. */
export const NotificationContent: FC<NotificationContentProps> = memo(
  ({ notification, onActionPress }) => {
    const { colors } = useTheme();
    const { variant, title, message, icon, action } = notification;
    const accent = accentColor(variant, colors);

    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderLeftColor: accent,
          },
        ]}
      >
        <View style={styles.icon}>
          {icon ??
            (variant === "loading" ? (
              <Spinner size={20} color={accent} />
            ) : (
              <View style={[styles.glyph, { backgroundColor: accent }]}>
                <Text style={[styles.glyphText, { color: colors.white }]}>
                  {VARIANT_GLYPH[variant]}
                </Text>
              </View>
            ))}
        </View>

        <View style={styles.body}>
          {title != null &&
            (typeof title === "string" ? (
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {title}
              </Text>
            ) : (
              title
            ))}
          {typeof message === "string" ? (
            <Text
              style={[
                styles.message,
                {
                  color:
                    title != null ? colors.textSecondary : colors.textPrimary,
                },
              ]}
            >
              {message}
            </Text>
          ) : (
            message
          )}
        </View>

        {!!action && (
          <Text
            style={[styles.action, { color: accent }]}
            onPress={onActionPress}
            suppressHighlighting
          >
            {action.label}
          </Text>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 4,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  icon: {
    width: 24,
    alignItems: "center",
  },
  glyph: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  glyphText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  message: {
    fontSize: 14,
  },
  action: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});
