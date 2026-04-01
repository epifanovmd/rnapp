import { ChatDto } from "@api/api-gen/data-contracts";
import {
  Col,
  Container,
  Navbar,
  RefreshingContainer,
  Text,
  Touchable,
} from "@components";
import { useTheme, useTransition } from "@core";
import { iocHook } from "@di";
import { AppScreenProps } from "@navigation";
import { IAuthStore } from "@store/auth";
import { useChatListStore } from "@store/chatList";
import { MessageSquareIcon, PlusIcon } from "lucide-react-native";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ChatListItem } from "./ChatListItem";

const useAuthStore = iocHook(IAuthStore);

export const Chats: FC<AppScreenProps> = observer(({ navigation }) => {
  const context = useTransition();
  const { colors } = useTheme();
  const chatListStore = useChatListStore();
  const authStore = useAuthStore();

  const handleChatPress = useCallback(
    (chat: ChatDto) => {
      (navigation as any).navigate("ChatRoom", { chatId: chat.id });
    },
    [navigation],
  );

  const handleNewChat = useCallback(() => {
    (navigation as any).navigate("NewChat");
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: ChatDto }) => (
      <ChatListItem
        chat={item}
        currentUserId={authStore.user?.id}
        onPress={handleChatPress}
      />
    ),
    [authStore.user?.id, handleChatPress],
  );

  const renderEmpty = useCallback(() => {
    if (chatListStore.isLoading) {
      return (
        <Col flex={1} justifyContent={"center"} alignItems={"center"} pt={100}>
          <ActivityIndicator size={"large"} color={colors.blue600} />
        </Col>
      );
    }

    return (
      <Col flex={1} justifyContent={"center"} alignItems={"center"} pt={100}>
        <MessageSquareIcon size={64} color={colors.textSecondary} />
        <Text textStyle={"Title_M"} color={"textSecondary"} mt={16}>
          No chats yet
        </Text>
        <Text
          textStyle={"Body_M1"}
          color={"textSecondary"}
          mt={8}
          style={styles.emptyText}
        >
          Start a conversation by tapping the + button
        </Text>
      </Col>
    );
  }, [chatListStore.isLoading, colors]);

  const keyExtractor = useCallback((item: ChatDto) => item.id, []);

  return (
    <Col flex={1}>
      <Navbar title={"Chats"} safeArea>
        <Navbar.Right>
          <Touchable onPress={handleNewChat} pa={8}>
            <PlusIcon size={24} color={colors.textPrimary} />
          </Touchable>
        </Navbar.Right>
      </Navbar>

      <RefreshingContainer.FlatList
        data={chatListStore.sortedChats}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={chatListStore.listHolder.isRefreshing}
        onRefresh={() => chatListStore.load()}
        onScroll={context.onScroll}
        contentContainerStyle={{
          paddingBottom: context.tabBarHeight,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => (
          <View
            style={[styles.separator, { backgroundColor: colors.slate300 }]}
          />
        )}
      />
    </Col>
  );
});

const styles = StyleSheet.create({
  emptyText: {
    textAlign: "center",
    paddingHorizontal: 32,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 76,
  },
});
