import {
  Container,
  HoldItem,
  HoldMenuItemProp,
  Navbar,
  NavbarTitle,
  Row,
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
import { StackProps, useTheme } from "@core";
import { useChatDataStore, useUserDataStore } from "@store";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ChatScreen: FC<StackProps<"ChatScreen">> = observer(
  ({ route }) => {
    const {
      params: { dialogId },
    } = route;
    const insets = useSafeAreaInsets();
    const { user } = useUserDataStore();
    const { colors } = useTheme();

    const chatDataStore = useChatDataStore();

    const [
      {
        dialog,
        isInitialized,
        isLoading,
        isLoadingMore,
        isOnline,
        isTyping,
        loadingMore,
        initialize,
        messages,
        handleViewableMessages,
        handleTyping,
        deleteMessage,
        sendMessage,
      },
    ] = useState(chatDataStore(dialogId));

    useEffect(() => {
      if (!isInitialized) {
        initialize(dialogId);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
              onPress: async ({ messageId }) => {
                await deleteMessage(messageId);
              },
            },
          ],
        },
      ],
      [deleteMessage],
    );

    const renderBubble = useCallback(
      (props: BubbleProps) => {
        return (
          <HoldItem
            data={{
              messageId: props.currentMessage.id,
              text: props.currentMessage.text,
              onReply: () => props.onReply?.(props.currentMessage),
            }}
            menu={menu}
          >
            <Bubble {...props} />
          </HoldItem>
        );
      },
      [menu],
    );

    const _messages = useMemo(
      () => [
        ...messages.map<IMessage>(msg => ({
          id: msg.id,
          text: msg.text,
          createdAt: dayjs(msg.createdAt).toDate(),
          updatedAt: dayjs(msg.updatedAt).toDate(),
          received: msg.received,
          sent: msg.sent,
          system: msg.system,
          reply: msg.reply && {
            id: msg.reply.id,
            text: msg.reply.text,
            createdAt: new Date(msg.reply.createdAt),
            updatedAt: new Date(msg.reply.updatedAt),
            received: msg.reply.received,
            sent: msg.reply.sent,
            system: msg.reply.system,
            user: {
              id: msg.reply.userId,
              name: msg.reply.user?.profile?.firstName || msg.reply.user?.email,
              avatar: msg.reply.user?.profile?.avatar || undefined,
            },
          },
          user: {
            id: msg.userId,
            name: msg.user?.profile?.firstName || msg.user?.email,
            avatar: msg.user?.profile?.avatar || undefined,
          },
        })),
      ],
      [messages],
    );

    const handleSend = useCallback(
      async (message: IMessage) => {
        await sendMessage({
          dialogId,
          text: message.text,
          replyId: message.replyId,
        });
      },
      [dialogId, sendMessage],
    );

    const username = useMemo(() => {
      const participant = dialog?.participants[0];
      const profile = participant?.profile;

      return (
        [profile?.firstName, profile?.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || participant?.email
      );
    }, [dialog?.participants]);

    if (!user) {
      return null;
    }

    // return <RecycleTestComponent />;

    return (
      <Container edges={[]}>
        <Navbar safeArea={true}>
          <Navbar.BackButton />
          <Navbar.Right>
            <View style={{ margin: 12 }}>
              <SwitchTheme marginLeft={"auto"} />
            </View>
          </Navbar.Right>
          <View style={{ gap: 2, alignItems: "center" }}>
            <Row gap={8} alignItems={"center"}>
              <NavbarTitle>{username}</NavbarTitle>
            </Row>
            {isOnline && !isTyping && (
              <Text textStyle={"Caption_M3"} color={"green500"}>
                {"онлайн"}
              </Text>
            )}
            {isTyping && (
              <TypingAnimation color={colors.textSecondary} text={"печатает"} />
            )}
          </View>
        </Navbar>

        <Chat
          user={{
            id: user.id,
            name: user.email,
            avatar: user.profile?.avatar?.url,
          }}
          onViewableMessages={handleViewableMessages}
          insets={insets}
          messages={_messages}
          loading={isLoading}
          loadEarlier={isLoadingMore}
          onLoadEarlier={loadingMore}
          renderLoading={renderLoading}
          showUsernameOnMessage={true}
          renderChatEmpty={renderEmpty}
          alwaysShowSend={true}
          scrollToBottom={true}
          renderBubble={renderBubble}
          onSend={handleSend}
          maxInputHeight={120}
          onInputTextChanged={handleTyping}
        />
      </Container>
    );
  },
);

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
