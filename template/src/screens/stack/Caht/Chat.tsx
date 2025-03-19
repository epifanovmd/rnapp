import { HoldItem, HoldMenuItemProp } from "@force-dev/react-mobile";
import { observer } from "mobx-react-lite";
import { FC, useCallback, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container, Header, Text } from "~@components";
import { Bubble, BubbleProps, Chat, TypingAnimation } from "~@components/chat";

import { StackProps } from "../../../navigation";

export const ChatScreen: FC<StackProps> = observer(() => {
  const insets = useSafeAreaInsets();

  const renderLoading = useCallback(
    () => (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size={"large"} />
      </View>
    ),
    [],
  );

  const menu = useMemo<HoldMenuItemProp<{ messageId: string; text: string }>[]>(
    () => [
      {
        text: "Скопировать",
        withSeparator: true,
        onPress: message => {
          console.log("Скопировать", message);
        },
      },
      {
        text: "Удалить",
        isDestructive: true,
        variants: [
          {
            text: "Удалить у всех",
            isDestructive: true,
            onPress: ({ messageId }) => {
              console.log("messageId", messageId);
            },
          },
        ],
      },
    ],
    [],
  );

  const renderBubble = useCallback(
    (props: BubbleProps) => (
      <HoldItem
        data={{
          messageId: props.currentMessage.id,
          text: props.currentMessage.text,
        }}
        items={menu}
        disableMove={false}
      >
        <Bubble {...props} />
      </HoldItem>
    ),
    [menu],
  );

  const isTyping = true;

  return (
    <Container safeAreBottom={false} safeAreLeft={false} safeAreRight={false}>
      <Header backAction={true}>
        {isTyping ? <TypingAnimation color={"#000"} text={"печатает"} /> : null}
      </Header>

      <Chat
        user={{ id: "123", name: "User" }}
        insets={insets}
        messages={[
          {
            id: "12345",
            user: { id: "123", name: "User" },
            text: "Какой то текст сообщения",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "324324",
            user: { id: "123", name: "User" },
            text: "Какой то текст сообщения",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "3242323с234",
            user: { id: "1234", name: "User1" },
            text: "Какой то текст сообщения",
            createdAt: new Date(),
            updatedAt: new Date(),
          },

          {
            id: "324324йу23",
            user: { id: "1234", name: "User2" },
            text: "Какой то текст сообщения и номер телефона +79040513805",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "534534534",
            user: { id: "екуе34534", name: "User3" },
            text: "Какой то текст сообщения и ссылка http://wireguard.force-dev.ru",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]}
        loading={false}
        renderLoading={renderLoading}
        renderChatEmpty={() => (
          <Text
            marginLeft={"auto"}
            marginRight={"auto"}
            marginTop={"auto"}
            marginBottom={"auto"}
          >
            {"Пусто"}
          </Text>
        )}
        alwaysShowSend={true}
        scrollToBottom={true}
        renderBubble={renderBubble}
        maxInputHeight={120}
      />
    </Container>
  );
});
