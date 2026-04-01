import {
  ChatMemberDto,
  EChatMemberRole,
  EChatType,
} from "@api/api-gen/data-contracts";
import { Col, Navbar, Row, Text, Touchable } from "@components";
import { useTheme } from "@core";
import { iocHook } from "@di";
import { StackProps } from "@navigation";
import { useChatStore } from "@store";
import { IAuthStore } from "@store/auth";
import {
  LogOutIcon,
  ShieldIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react-native";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";

const useAuthStore = iocHook(IAuthStore);

export const ChatInfo: FC<StackProps<"ChatInfo">> = observer(
  ({ route, navigation }) => {
    const { chatId } = route.params;
    const { colors } = useTheme();
    const chatStore = useChatStore();
    const authStore = useAuthStore();

    const chat = chatStore.chat;

    if (!chat) return null;

    const isGroup = chat.type === EChatType.Group;
    const currentUserId = authStore.user?.id;

    const currentMember = chat.members.find(m => m.userId === currentUserId);
    const isOwner = currentMember?.role === EChatMemberRole.Owner;
    const isAdmin = currentMember?.role === EChatMemberRole.Admin || isOwner;

    const chatName =
      chat.name ??
      (() => {
        const other = chat.members.find(m => m.userId !== currentUserId);

        return other?.profile
          ? [other.profile.firstName, other.profile.lastName]
              .filter(Boolean)
              .join(" ")
          : "Chat";
      })();

    const handleLeave = useCallback(() => {
      Alert.alert("Leave Chat", "Are you sure you want to leave this chat?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            await chatStore.leaveChat(chatId);
            navigation.popToTop();
          },
        },
      ]);
    }, [chatId, chatStore, navigation]);

    const handleRemoveMember = useCallback(
      (member: ChatMemberDto) => {
        Alert.alert(
          "Remove Member",
          `Remove ${member.profile?.firstName ?? "this user"} from the chat?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Remove",
              style: "destructive",
              onPress: () => chatStore.removeMember(chatId, member.userId),
            },
          ],
        );
      },
      [chatId, chatStore],
    );

    const handleAddMembers = useCallback(() => {
      (navigation as any).navigate("NewGroupChat");
    }, [navigation]);

    const getRoleIcon = useCallback(
      (role: EChatMemberRole) => {
        switch (role) {
          case EChatMemberRole.Owner:
            return <ShieldIcon size={16} color={"#FFD700"} />;
          case EChatMemberRole.Admin:
            return <ShieldIcon size={16} color={colors.blue600} />;
          default:
            return null;
        }
      },
      [colors.blue600],
    );

    const renderMember = useCallback(
      ({ item }: { item: ChatMemberDto }) => {
        const profile = item.profile;
        const displayName = profile
          ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
          : "User";
        const isCurrentUser = item.userId === currentUserId;
        const canRemove =
          isAdmin && !isCurrentUser && item.role !== EChatMemberRole.Owner;

        return (
          <Row pa={12} alignItems={"center"}>
            <View
              style={[
                styles.memberAvatar,
                { backgroundColor: colors.slate300 },
              ]}
            >
              <UserIcon size={18} color={"white"} />
            </View>

            <Col flex={1} ml={12}>
              <Row alignItems={"center"}>
                <Text textStyle={"Body_L1"}>
                  {displayName}
                  {isCurrentUser ? " (You)" : ""}
                </Text>
                {getRoleIcon(item.role) && (
                  <View style={styles.roleIcon}>{getRoleIcon(item.role)}</View>
                )}
              </Row>
              <Text textStyle={"Body_S1"} color={"textSecondary"}>
                {item.role}
              </Text>
            </Col>

            {canRemove && (
              <Touchable onPress={() => handleRemoveMember(item)} pa={8}>
                <TrashIcon size={18} color={colors.red500} />
              </Touchable>
            )}
          </Row>
        );
      },
      [colors, currentUserId, getRoleIcon, handleRemoveMember, isAdmin],
    );

    return (
      <Col flex={1}>
        <Navbar title={"Chat Info"} safeArea>
          <Navbar.BackButton onPress={() => navigation.goBack()} />
          <Navbar.Title />
        </Navbar>

        {/* Chat header */}
        <Col alignItems={"center"} pa={24}>
          <View
            style={[
              styles.largeAvatar,
              {
                backgroundColor: isGroup ? colors.blue600 : colors.slate300,
              },
            ]}
          >
            {isGroup ? (
              <UsersIcon size={32} color={"white"} />
            ) : (
              <Text
                color={"white"}
                textStyle={"Title_L"}
                style={styles.largeAvatarText}
              >
                {chatName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text textStyle={"Title_L"} mt={12}>
            {chatName}
          </Text>
          {isGroup && (
            <Text textStyle={"Body_M1"} color={"textSecondary"} mt={4}>
              {`${chat.members.length} members`}
            </Text>
          )}
        </Col>

        <View style={[styles.divider, { backgroundColor: colors.slate300 }]} />

        {/* Members section */}
        {isGroup && (
          <>
            <Row pa={12} justifyContent={"space-between"} alignItems={"center"}>
              <Text textStyle={"Title_M"} color={"textSecondary"}>
                Members
              </Text>
              {isAdmin && (
                <Touchable onPress={handleAddMembers} pa={4}>
                  <Text textStyle={"Body_M1"} color={"blue600"}>
                    Add
                  </Text>
                </Touchable>
              )}
            </Row>

            <FlatList
              data={chat.members}
              renderItem={renderMember}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />

            <View
              style={[styles.divider, { backgroundColor: colors.slate300 }]}
            />
          </>
        )}

        {/* Actions */}
        <Touchable onPress={handleLeave} pa={16}>
          <Row alignItems={"center"}>
            <LogOutIcon size={20} color={colors.red500} />
            <Text textStyle={"Body_L1"} color={"red500"} ml={12}>
              Leave Chat
            </Text>
          </Row>
        </Touchable>
      </Col>
    );
  },
);

const styles = StyleSheet.create({
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  largeAvatarText: {
    fontSize: 32,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  roleIcon: {
    marginLeft: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
