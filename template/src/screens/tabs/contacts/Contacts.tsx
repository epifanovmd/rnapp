import {
  Col,
  Navbar,
  RefreshingContainer,
  Row,
  Text,
  Touchable,
} from "@components";
import { useTheme, useTransition } from "@core";
import { AppScreenProps } from "@navigation";
import { useContactStore } from "@store/contacts";
import { ContactModel } from "@store/models";
import { CheckIcon, UserPlusIcon, UsersIcon, XIcon } from "lucide-react-native";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useEffect, useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export const Contacts: FC<AppScreenProps> = observer(({ navigation }) => {
  const context = useTransition();
  const { colors } = useTheme();
  const contactStore = useContactStore();

  useEffect(() => {
    contactStore.load();
  }, [contactStore]);

  const acceptedContacts = contactStore.acceptedContacts;
  const pendingContacts = contactStore.pendingContacts;

  const handleAccept = useCallback(
    (id: string) => {
      contactStore.acceptContact(id);
    },
    [contactStore],
  );

  const handleRemove = useCallback(
    (id: string) => {
      contactStore.removeContact(id);
    },
    [contactStore],
  );

  const handleStartChat = useCallback(
    (contact: ContactModel) => {
      (navigation as any).navigate("NewChat", {
        preselectedUserId: contact.contactUserId,
      });
    },
    [navigation],
  );

  const renderContact = useCallback(
    ({ item }: { item: ContactModel }) => {
      const displayName = item.displayName;
      const isPending = item.isPending;

      return (
        <Touchable
          onPress={() => handleStartChat(item)}
          pa={12}
          bg={colors.background}
        >
          <Row alignItems={"center"}>
            <View style={[styles.avatar, { backgroundColor: colors.slate300 }]}>
              <Text color={"white"} textStyle={"Title_L"}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <Col flex={1} ml={12}>
              <Text textStyle={"Title_M"}>{displayName}</Text>
              {isPending && (
                <Text textStyle={"Body_S1"} color={"textSecondary"} mt={2}>
                  Pending
                </Text>
              )}
            </Col>

            {isPending && (
              <Row>
                <Touchable
                  onPress={() => handleAccept(item.data.id)}
                  pa={8}
                  mr={4}
                >
                  <CheckIcon size={20} color={"#4CAF50"} />
                </Touchable>
                <Touchable onPress={() => handleRemove(item.data.id)} pa={8}>
                  <XIcon size={20} color={colors.red500} />
                </Touchable>
              </Row>
            )}
          </Row>
        </Touchable>
      );
    },
    [colors, handleAccept, handleRemove, handleStartChat],
  );

  const allContacts = contactStore.allContacts;

  const renderEmpty = useCallback(() => {
    if (contactStore.isLoading) {
      return (
        <Col flex={1} justifyContent={"center"} alignItems={"center"} pt={100}>
          <ActivityIndicator size={"large"} color={colors.blue600} />
        </Col>
      );
    }

    return (
      <Col flex={1} justifyContent={"center"} alignItems={"center"} pt={100}>
        <UsersIcon size={64} color={colors.textSecondary} />
        <Text textStyle={"Title_M"} color={"textSecondary"} mt={16}>
          No contacts yet
        </Text>
      </Col>
    );
  }, [contactStore.isLoading, colors]);

  return (
    <Col flex={1}>
      <Navbar title={"Contacts"} safeArea>
        <Navbar.Right>
          <Touchable
            onPress={() => (navigation as any).navigate("NewChat")}
            pa={8}
          >
            <UserPlusIcon size={24} color={colors.textPrimary} />
          </Touchable>
        </Navbar.Right>
      </Navbar>

      <RefreshingContainer.FlatList
        data={allContacts}
        renderItem={renderContact}
        keyExtractor={item => item.data.id}
        refreshing={contactStore.contactsHolder.isRefreshing}
        onRefresh={() => contactStore.load()}
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
  },
});
