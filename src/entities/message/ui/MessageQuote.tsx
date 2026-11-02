import { getTextStyle } from "@shared/ui";
import React, { FC, memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export interface IMessageQuoteProps {
  authorName: string;
  text: string;
  /** Цвет полосы и имени автора. */
  accentColor: string;
  /** Подложка цитаты. */
  backgroundColor: string;
  textColor: string;
  /** Переход к цитируемому сообщению. */
  onPress?: () => void;
}

/**
 * Цитата: акцентная полоса, автор и одна строка текста.
 *
 * Разметка на примитивах и статических стилях: строка списка живёт в горячем
 * пути — её пересобирают на каждой переработке контейнера, и лишний объект
 * стиля здесь оборачивается новым замером всей строки.
 */
export const MessageQuote: FC<IMessageQuoteProps> = memo(
  ({ authorName, text, accentColor, backgroundColor, textColor, onPress }) => (
    <Pressable
      style={[ss.container, { backgroundColor }]}
      disabled={!onPress}
      onPress={onPress}
    >
      <View style={[ss.accent, { backgroundColor: accentColor }]} />
      <View style={ss.body}>
        <Text
          numberOfLines={1}
          style={[getTextStyle("Caption_M1"), { color: accentColor }]}
        >
          {authorName}
        </Text>
        <Text
          numberOfLines={1}
          style={[getTextStyle("Caption_M3"), { color: textColor }]}
        >
          {text}
        </Text>
      </View>
    </Pressable>
  ),
);

MessageQuote.displayName = "MessageQuote";

const ss = StyleSheet.create({
  accent: { width: 3 },
  body: { flex: 1, paddingHorizontal: 8, paddingVertical: 6 },
  container: { borderRadius: 8, flexDirection: "row", overflow: "hidden" },
});
