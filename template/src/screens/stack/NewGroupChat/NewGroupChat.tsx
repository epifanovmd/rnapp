import { IApiService } from "@api";
import { IUserOptionDto } from "@api/api-gen/data-contracts";
import { Col, Navbar, Row, Text, Touchable } from "@components";
import { useTheme } from "@core";
import { iocHook } from "@di";
import { StackProps } from "@navigation";
import { useChatListStore } from "@store/chatList";
import { CheckIcon, SearchIcon } from "lucide-react-native";
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

export const NewGroupChat: FC<StackProps<"NewGroupChat">> = observer(
  ({ navigation }) => {
    const { colors } = useTheme();
    const chatListStore = useChatListStore();
    const api = useApiService();

    const [groupName, setGroupName] = useState("");
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<IUserOptionDto[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

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

    const toggleUser = useCallback((userId: string) => {
      setSelectedIds(prev => {
        const next = new Set(prev);

        if (next.has(userId)) {
          next.delete(userId);
        } else {
          next.add(userId);
        }

        return next;
      });
    }, []);

    const handleCreate = useCallback(async () => {
      if (!groupName.trim() || selectedIds.size === 0) return;

      setCreating(true);

      const result = await chatListStore.createGroupChat(
        groupName.trim(),
        Array.from(selectedIds),
      );

      setCreating(false);

      if (result) {
        navigation.replace("ChatRoom" as any, {
          chatId: result.id,
        });
      }
    }, [chatListStore, groupName, navigation, selectedIds]);

    const canCreate = groupName.trim().length > 0 && selectedIds.size > 0;

    const renderUser = useCallback(
      ({ item }: { item: IUserOptionDto }) => {
        const isSelected = selectedIds.has(item.id);

        return (
          <Touchable
            onPress={() => toggleUser(item.id)}
            pa={12}
            bg={colors.background}
          >
            <Row alignItems={"center"}>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: isSelected
                      ? colors.blue600
                      : colors.slate300,
                  },
                ]}
              >
                {isSelected ? (
                  <CheckIcon size={20} color={"white"} />
                ) : (
                  <Text color={"white"} textStyle={"Title_M"}>
                    {(item.name ?? "U").charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text textStyle={"Body_L1"} ml={12} flex={1}>
                {item.name}
              </Text>
              {isSelected && (
                <View
                  style={[
                    styles.checkBadge,
                    { backgroundColor: colors.blue600 },
                  ]}
                >
                  <CheckIcon size={14} color={"white"} />
                </View>
              )}
            </Row>
          </Touchable>
        );
      },
      [colors, selectedIds, toggleUser],
    );

    return (
      <Col flex={1}>
        <Navbar title={"New Group"} safeArea>
          <Navbar.BackButton onPress={() => navigation.goBack()} />
          <Navbar.Title />
          <Navbar.Right>
            <Touchable onPress={handleCreate} pa={8} disabled={!canCreate}>
              {creating ? (
                <ActivityIndicator size={"small"} color={colors.blue600} />
              ) : (
                <Text
                  textStyle={"Title_M"}
                  color={canCreate ? "blue600" : "textSecondary"}
                >
                  Create
                </Text>
              )}
            </Touchable>
          </Navbar.Right>
        </Navbar>

        {/* Group Name Input */}
        <View
          style={[
            styles.groupNameContainer,
            { borderBottomColor: colors.slate300 },
          ]}
        >
          <TextInput
            style={[styles.groupNameInput, { color: colors.textPrimary }]}
            placeholder={"Group name"}
            placeholderTextColor={colors.textSecondary}
            value={groupName}
            onChangeText={setGroupName}
            autoFocus
          />
        </View>

        {/* Selected count */}
        {selectedIds.size > 0 && (
          <View
            style={[
              styles.selectedBanner,
              { backgroundColor: colors.blue600 + "15" },
            ]}
          >
            <Text textStyle={"Body_M1"} color={"blue600"}>
              {`${selectedIds.size} member${
                selectedIds.size > 1 ? "s" : ""
              } selected`}
            </Text>
          </View>
        )}

        {/* Search */}
        <View
          style={[
            styles.searchContainer,
            { borderBottomColor: colors.slate300 },
          ]}
        >
          <SearchIcon size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={"Search users..."}
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

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
  },
);

const styles = StyleSheet.create({
  groupNameContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  groupNameInput: {
    fontSize: 18,
    paddingVertical: 4,
  },
  selectedBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
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
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  itemSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },
});
