import { ChatDto, EChatType } from "@api/api-gen/data-contracts";
import { Col, Row, Text, Touchable } from "@components";
import { useTheme } from "@core";
import { IAuthStore } from "@store/auth";
import { observer } from "mobx-react-lite";
import React, { FC, memo, useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";

interface ChatListItemProps {
  chat: ChatDto;
  currentUserId?: string;
  onPress: (chat: ChatDto) => void;
}

export const ChatListItem: FC<ChatListItemProps> = memo(
  ({ chat, currentUserId, onPress }) => {
    const { colors } = useTheme();

    const handlePress = useCallback(() => {
      onPress(chat);
    }, [chat, onPress]);

    const displayName = useMemo(() => {
      if (chat.name) return chat.name;

      if (chat.type === EChatType.Direct) {
        const otherMember = chat.members.find(m => m.userId !== currentUserId);

        if (otherMember?.profile) {
          const { firstName, lastName } = otherMember.profile;

          return [firstName, lastName].filter(Boolean).join(" ") || "User";
        }
      }

      return "Chat";
    }, [chat, currentUserId]);

    const avatarLetter = displayName.charAt(0).toUpperCase();

    const isOnline = useMemo(() => {
      if (chat.type !== EChatType.Direct) return false;

      const otherMember = chat.members.find(m => m.userId !== currentUserId);

      if (!otherMember?.profile?.lastOnline) return false;

      // Считаем онлайн, если lastOnline < 5 мин назад
      const lastOnline = new Date(otherMember.profile.lastOnline).getTime();

      return Date.now() - lastOnline < 5 * 60 * 1000;
    }, [chat, currentUserId]);

    const lastMessageTime = useMemo(() => {
      if (!chat.lastMessageAt) return "";

      const date = new Date(chat.lastMessageAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: "short" });
      }

      return date.toLocaleDateString([], {
        day: "2-digit",
        month: "2-digit",
      });
    }, [chat.lastMessageAt]);

    const memberCount =
      chat.type === EChatType.Group ? chat.members.length : undefined;

    return (
      <Touchable onPress={handlePress} pa={12} bg={colors.background}>
        <Row flex={1} alignItems={"center"}>
          {/* Avatar */}
          <View
            style={[
              styles.avatar,
              {
                backgroundColor:
                  chat.type === EChatType.Group
                    ? colors.blue600
                    : colors.slate300,
              },
            ]}
          >
            <Text
              color={"white"}
              textStyle={"Title_L"}
              style={styles.avatarText}
            >
              {avatarLetter}
            </Text>
            {isOnline && (
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor: "#4CAF50",
                    borderColor: colors.background,
                  },
                ]}
              />
            )}
          </View>

          {/* Content */}
          <Col flex={1} ml={12}>
            <Row justifyContent={"space-between"} alignItems={"center"}>
              <Text textStyle={"Title_M"} numberOfLines={1} style={styles.name}>
                {displayName}
              </Text>
              {lastMessageTime ? (
                <Text textStyle={"Body_S1"} color={"textSecondary"}>
                  {lastMessageTime}
                </Text>
              ) : null}
            </Row>

            <Row mt={4} alignItems={"center"}>
              {memberCount !== undefined && (
                <Text textStyle={"Body_S1"} color={"textSecondary"}>
                  {`${memberCount} members`}
                </Text>
              )}
            </Row>
          </Col>
        </Row>
      </Touchable>
    );
  },
);

const styles = StyleSheet.create({
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    textAlign: "center",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  name: {
    flex: 1,
    marginRight: 8,
  },
});
