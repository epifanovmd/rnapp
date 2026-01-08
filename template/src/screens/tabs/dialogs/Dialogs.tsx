import {
  Chip,
  Col,
  Container,
  Content,
  Image,
  Navbar,
  RefreshingContainer,
  Row,
  Text,
  Touchable,
} from "@components";
import { AppScreenProps, useTheme } from "@core";
import { disposer } from "@force-dev/utils";
import { useUserDataStore } from "@store";
import { useDialogsDataStore } from "@store/dialogs";
import { UserIcon } from "lucide-react-native";
import { observer } from "mobx-react-lite";
import React, { FC, useEffect } from "react";

export const Dialogs: FC<AppScreenProps> = observer(
  ({ route: { name }, navigation: { navigate } }) => {
    const {
      initialize,
      data,
      isLoading,
      isLoadingMore,
      refresh,
      loadMore,
      onViewableItemsChanged,
    } = useDialogsDataStore();
    const { user } = useUserDataStore();
    const { colors } = useTheme();

    useEffect(() => {
      const dispose = initialize();

      return () => {
        disposer(dispose);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <Container edges={["top"]}>
        <Navbar>
          <Navbar.Title text={name} />
        </Navbar>
        <Content>
          <RefreshingContainer.FlatList
            onRefresh={refresh}
            onEndReached={loadMore}
            refreshing={isLoading}
            data={data}
            onViewableItemsChanged={onViewableItemsChanged}
            ItemSeparatorComponent={() => <Col height={8} />}
            renderItem={({
              item: {
                id,
                participants,
                lastMessage,
                unreadMessagesCount,
                online,
              },
            }) => {
              const participant =
                participants.find(item => item.userId !== user?.id) ??
                participants[0];

              return (
                <Touchable
                  key={id}
                  onPress={() => navigate("ChatScreen", { dialogId: id })}
                >
                  <Row radius={16} bg={"surface"} alignItems={"center"} pa={8}>
                    <Row gap={8} alignItems={"center"}>
                      <Col
                        circle={48}
                        overflow={"hidden"}
                        bg={"onSurface"}
                        centerContent={true}
                      >
                        {participant.profile.avatar ? (
                          <Image
                            height={48}
                            width={48}
                            url={participant.profile.avatar}
                          />
                        ) : (
                          <UserIcon color={colors.textPrimary} />
                        )}
                      </Col>

                      <Col flex={1}>
                        <Row alignItems={"center"} gap={8}>
                          <Text textStyle={"Title_M"}>
                            {participant.profile.firstName || participant.email}
                          </Text>

                          {!!online && (
                            <Text textStyle={"Caption_M3"} color={"green500"}>
                              {"онлайн"}
                            </Text>
                          )}
                        </Row>
                        <Text textStyle={"Caption_M3"} color={"textSecondary"}>
                          {lastMessage?.text}
                        </Text>
                      </Col>

                      {!!unreadMessagesCount && (
                        <Col pa={8}>
                          <Chip
                            text={String(unreadMessagesCount)}
                            isActive={true}
                            disabled={true}
                          />
                        </Col>
                      )}
                    </Row>
                  </Row>
                </Touchable>
              );
            }}
          />
        </Content>
      </Container>
    );
  },
);
