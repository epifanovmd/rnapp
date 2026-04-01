import { IApiService } from "@api";
import { IUserOptionDto } from "@api/api-gen/data-contracts";
import { Col, Navbar, Row, Text, Touchable } from "@components";
import { useTheme } from "@core";
import { iocHook } from "@di";
import { StackProps } from "@navigation";
import { useChatListStore } from "@store/chatList";
import { SearchIcon, UsersIcon } from "lucide-react-native";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

const useApiService = iocHook(IApiService);

export const NewChat: FC<StackProps<"NewChat">> = observer(({ navigation }) => {
  const { colors } = useTheme();
  const chatListStore = useChatListStore();
  const api = useApiService();

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<IUserOptionDto[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);

    const res = await api.getUserOptions({ query: "" });

    if (res.data) {
      setUsers(res.data.data);
    }

    setLoading(false);
  }, [api]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = search
    ? users.filter(u =>
        (u.name ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  const handleUserPress = useCallback(
    async (user: IUserOptionDto) => {
      const result = await chatListStore.createDirectChat(user.id);

      if (result) {
        navigation.replace("ChatRoom" as any, {
          chatId: result.id,
        });
      }
    },
    [chatListStore, navigation],
  );

  const handleNewGroup = useCallback(() => {
    (navigation as any).navigate("NewGroupChat");
  }, [navigation]);

  const renderUser = useCallback(
    ({ item }: { item: IUserOptionDto }) => (
      <Touchable
        onPress={() => handleUserPress(item)}
        pa={12}
        bg={colors.background}
      >
        <Row alignItems={"center"}>
          <View style={[styles.avatar, { backgroundColor: colors.slate300 }]}>
            <Text color={"white"} textStyle={"Title_M"}>
              {(item.name ?? "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text textStyle={"Body_L1"} ml={12}>
            {item.name ?? "User"}
          </Text>
        </Row>
      </Touchable>
    ),
    [colors, handleUserPress],
  );

  return (
    <Col flex={1}>
      <Navbar title={"New Chat"} safeArea>
        <Navbar.BackButton onPress={() => navigation.goBack()} />
        <Navbar.Title />
      </Navbar>

      {/* Search */}
      <View
        style={[styles.searchContainer, { borderBottomColor: colors.slate300 }]}
      >
        <SearchIcon size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder={"Search users..."}
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
      </View>

      {/* New Group */}
      <Touchable onPress={handleNewGroup} pa={12} bg={colors.background}>
        <Row alignItems={"center"}>
          <View style={[styles.avatar, { backgroundColor: colors.blue600 }]}>
            <UsersIcon size={20} color={"white"} />
          </View>
          <Text textStyle={"Title_M"} ml={12}>
            New Group
          </Text>
        </Row>
      </Touchable>

      <View style={[styles.separator, { backgroundColor: colors.slate300 }]} />

      {loading ? (
        <Col flex={1} justifyContent={"center"} alignItems={"center"}>
          <ActivityIndicator size={"large"} color={colors.blue600} />
        </Col>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View
              style={[
                styles.itemSeparator,
                { backgroundColor: colors.slate300 },
              ]}
            />
          )}
        />
      )}
    </Col>
  );
});

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    paddingVertical: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  itemSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },
});
