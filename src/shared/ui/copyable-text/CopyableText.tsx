import { useClipboard } from "@shared/lib/hooks";
import { useNotifications } from "@shared/lib/notifications";
import { useTheme } from "@shared/lib/theme";
import React, { FC, memo, useCallback } from "react";
import { Platform, StyleSheet } from "react-native";

import { FlexProps } from "../flex-view";
import { Icon } from "../icon";
import { Text } from "../text";
import { Touchable } from "../touchable";

export interface ICopyableTextProps extends FlexProps {
  text: string;
  /** Что показать вместо `text` (например, сокращённый ключ). */
  displayText?: string;
  /** Моноширинный текст (ключи, адреса). */
  mono?: boolean;
  numberOfLines?: number;
  /** Тост после копирования; `null` — без тоста. */
  copiedLabel?: string | null;
}

/** Текст с копированием по нажатию. */
export const CopyableText: FC<ICopyableTextProps> = memo(
  ({
    text,
    displayText,
    mono,
    numberOfLines = 1,
    copiedLabel = "Скопировано",
    ...rest
  }) => {
    const { colors } = useTheme();
    const toast = useNotifications();
    const { copy, copied } = useClipboard();

    const onPress = useCallback(() => {
      if (!copy(text)) {
        toast.error("Буфер обмена недоступен");

        return;
      }
      if (copiedLabel) toast.success(copiedLabel, { duration: 1500 });
    }, [copy, copiedLabel, text, toast]);

    return (
      <Touchable
        row
        alignItems={"center"}
        gap={6}
        flexShrink={1}
        onPress={onPress}
        accessibilityRole={"button"}
        accessibilityHint={"Скопировать"}
        {...rest}
      >
        <Text
          flexShrink={1}
          textStyle={"Body_S2"}
          numberOfLines={numberOfLines}
          ellipsizeMode={"middle"}
          style={mono ? styles.mono : undefined}
        >
          {displayText ?? text}
        </Text>
        <Icon
          name={copied ? "check" : "copy"}
          size={14}
          color={copied ? colors.success : colors.textTertiary}
        />
      </Touchable>
    );
  },
);

const styles = StyleSheet.create({
  mono: {
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});
