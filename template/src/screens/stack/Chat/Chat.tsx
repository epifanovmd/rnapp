import { useDimensions } from "@common";
import {
  Container,
  HoldItem,
  HoldMenuItemProp,
  Navbar,
  NavbarTitle,
  SwitchTheme,
  Text,
} from "@components";
import {
  Bubble,
  BubbleProps,
  Chat,
  IMessage,
  TypingAnimation,
} from "@components/chat";
import { StackProps } from "@core";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ChatScreen: FC<StackProps> = observer(({ route }) => {
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

  const menu = useMemo<
    HoldMenuItemProp<{
      messageId: string;
      text: string;
      onReply?: () => void;
    }>[]
  >(
    () => [
      {
        text: "Скопировать",
        onPress: ({ text }) => {
          console.log("Скопировать", text);
        },
      },
      {
        text: "Ответить",
        withSeparator: true,
        onPress: ({ onReply }) => {
          setTimeout(() => onReply?.(), 0);
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

  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setIsTyping(state => !state);
    }, 5000);

    return () => {
      clearInterval(id);
    };
  }, []);

  const msgs = useMemo(
    () =>
      new Array(1000).fill(1).map<IMessage>((_, index) => ({
        id: `${_ + index}`,
        user: { id: index % 4 === 3 ? "123" : "1234", name: "User1" },
        text: `Какой то текст сообщения + ${_ + index}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: {
          id: index,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          name: "name",
          size: 1,
          url: "https://dummyjson.com/image/400x200/282828?fontFamily=pacifico&text=I+am+a+pacifico+font",
          type: "image/png",
        },
      })),
    [],
  );

  const { height, width } = useDimensions();

  const renderBubble = useCallback(
    (props: BubbleProps) => {
      // return <Bubble {...props} />;

      return (
        <HoldItem
          data={{
            messageId: props.currentMessage.id,
            text: props.currentMessage.text,
            onReply: () => props.onReply?.(props.currentMessage),
          }}
          menu={menu}
          // targetPositions={{
          //   width: width / 1.5,
          //   height: width / 1.5,
          //   left: width / 6,
          //   top: height / 1.5 - width / 1.5,
          // }}
        >
          <Bubble {...props} />
        </HoldItem>
      );
    },
    [menu],
  );

  const messages = useMemo(
    () => [
      ...msgs,
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
    ],
    [msgs],
  );

  return (
    <Container edges={[]}>
      <Navbar safeArea={true}>
        <Navbar.BackButton />
        <Navbar.Right>
          <View style={{ margin: 12 }}>
            <SwitchTheme marginLeft={"auto"} />
          </View>
        </Navbar.Right>
        <View style={{ gap: 2 }}>
          <NavbarTitle>{route.name}</NavbarTitle>
          {isTyping && <TypingAnimation color={"#000"} text={"печатает"} />}
        </View>
      </Navbar>

      <Chat
        user={user}
        insets={insets}
        messages={messages}
        loading={false}
        renderLoading={renderLoading}
        showUsernameOnMessage={true}
        renderChatEmpty={renderEmpty}
        alwaysShowSend={true}
        scrollToBottom={true}
        renderBubble={renderBubble}
        maxInputHeight={120}
      />
    </Container>
  );
});

const renderEmpty = () => (
  <Text
    marginLeft={"auto"}
    marginRight={"auto"}
    marginTop={"auto"}
    marginBottom={"auto"}
  >
    {"Пусто"}
  </Text>
);

const user = { id: "123", name: "User" };
