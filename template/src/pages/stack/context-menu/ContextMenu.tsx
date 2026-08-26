import { useTheme } from "@shared/lib/theme";
import {
  Container,
  Content,
  ContextMenuAction,
  ScrollView,
  Text,
} from "@shared/ui";
import { ContextMenuView } from "@shared/ui/context-menu-view";
import { observer } from "mobx-react-lite";
import React, { FC, useState } from "react";
import { StyleSheet, View } from "react-native";

const EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];

const MESSAGE_ACTIONS: ContextMenuAction[] = [
  { id: "reply", title: "Reply", systemImage: "arrowshape.turn.up.left" },
  { id: "copy", title: "Copy", systemImage: "doc.on.doc" },
  { id: "pin", title: "Pin", systemImage: "pin" },
  { id: "forward", title: "Forward", systemImage: "arrowshape.turn.up.right" },
  { id: "delete", title: "Delete", systemImage: "trash", isDestructive: true },
];

const SHORT_ACTIONS: ContextMenuAction[] = [
  { id: "edit", title: "Edit", systemImage: "pencil" },
  { id: "share", title: "Share", systemImage: "square.and.arrow.up" },
  { id: "star", title: "Star", systemImage: "star" },
];

const NO_ICON_ACTIONS: ContextMenuAction[] = [
  { id: "select", title: "Select" },
  { id: "select-all", title: "Select All" },
  { id: "delete", title: "Delete", isDestructive: true },
];

const LONG_TEXT =
  "Очень длинное сообщение, которое занимает много места на экране — " +
  "нужно, чтобы проверить режим прокрутки: когда высота эмодзи-панели, " +
  "превью и меню действий суммарно не помещается между safe area, " +
  "канва становится выше экрана и прокручивается, а меню изначально " +
  "показывается прижатым к низу. ".repeat(4);

export const ContextMenu: FC = observer(() => {
  const { colors } = useTheme();

  const [lastEvent, setLastEvent] = useState("—");

  const bubbleProps = (menuId: string) => ({
    onWillShow: () => setLastEvent(`onWillShow · ${menuId}`),
    onEmojiSelect: (emoji: string) =>
      setLastEvent(`onEmojiSelect · ${emoji} · ${menuId}`),
    onActionSelect: (actionId: string) =>
      setLastEvent(`onActionSelect · ${actionId} · ${menuId}`),
    onDismiss: () => setLastEvent(`onDismiss · ${menuId}`),
  });

  return (
    <Container edges={[]}>
      <Content flex={0}>
        <Text mt={8} textStyle={"Caption_M2"} color={"textSecondary"}>
          {`Последнее событие: ${lastEvent}`}
        </Text>
      </Content>

      <ScrollView>
        <Content pb={40}>
          <Text mt={16} textStyle={"Title_M"}>
            {"Входящее сообщение"}
          </Text>
          <ContextMenuView
            {...bubbleProps("incoming")}
            emojis={EMOJIS}
            actions={MESSAGE_ACTIONS}
            style={ss.leftBubbleWrap}
          >
            <View style={[ss.bubble, { backgroundColor: colors.onSurface }]}>
              <Text textStyle={"Body_M1"}>
                {"Привет! Зажми меня — появится меню с реакциями и действиями."}
              </Text>
            </View>
          </ContextMenuView>

          <Text mt={24} textStyle={"Title_M"}>
            {"Исходящее сообщение"}
          </Text>
          <ContextMenuView
            {...bubbleProps("outgoing")}
            emojis={EMOJIS}
            actions={MESSAGE_ACTIONS}
            style={ss.rightBubbleWrap}
          >
            <View style={[ss.bubble, { backgroundColor: colors.primary }]}>
              <Text textStyle={"Body_M1"} color={"primaryForeground"}>
                {
                  "Сообщение справа: проверка смещения превью и выравнивания панели эмодзи по правому краю."
                }
              </Text>
            </View>
          </ContextMenuView>

          <Text mt={24} textStyle={"Title_M"}>
            {"Только действия"}
          </Text>
          <ContextMenuView
            {...bubbleProps("actions-only")}
            actions={SHORT_ACTIONS}
            style={ss.leftBubbleWrap}
          >
            <View style={[ss.bubble, { backgroundColor: colors.onSurface }]}>
              <Text textStyle={"Body_M1"}>
                {"Без эмодзи-панели — только меню действий."}
              </Text>
            </View>
          </ContextMenuView>

          <Text mt={24} textStyle={"Title_M"}>
            {"Только эмодзи"}
          </Text>
          <ContextMenuView
            {...bubbleProps("emoji-only")}
            emojis={EMOJIS}
            style={ss.leftBubbleWrap}
          >
            <View style={[ss.bubble, { backgroundColor: colors.onSurface }]}>
              <Text textStyle={"Body_M1"}>
                {"Без меню действий — только панель реакций."}
              </Text>
            </View>
          </ContextMenuView>

          <Text mt={24} textStyle={"Title_M"}>
            {"Действия без иконок"}
          </Text>
          <ContextMenuView
            {...bubbleProps("no-icons")}
            emojis={EMOJIS}
            actions={NO_ICON_ACTIONS}
            style={ss.rightBubbleWrap}
          >
            <View style={[ss.bubble, { backgroundColor: colors.primary }]}>
              <Text textStyle={"Body_M1"} color={"primaryForeground"}>
                {"Пункты меню без systemImage — заголовок от левого отступа."}
              </Text>
            </View>
          </ContextMenuView>

          <Text mt={24} textStyle={"Title_M"}>
            {"Длинное сообщение (режим прокрутки)"}
          </Text>
          <ContextMenuView
            {...bubbleProps("long")}
            emojis={EMOJIS}
            actions={MESSAGE_ACTIONS}
            style={ss.leftBubbleWrap}
          >
            <View style={[ss.bubble, { backgroundColor: colors.onSurface }]}>
              <Text textStyle={"Body_M1"}>{LONG_TEXT}</Text>
            </View>
          </ContextMenuView>
        </Content>
      </ScrollView>
    </Container>
  );
});

const ss = StyleSheet.create({
  leftBubbleWrap: {
    marginTop: 8,
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  rightBubbleWrap: {
    marginTop: 8,
    alignSelf: "flex-end",
    maxWidth: "80%",
  },
  bubble: {
    borderRadius: 16,
    borderCurve: "continuous",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
