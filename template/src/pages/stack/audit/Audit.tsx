import { agentAuditTitle, IAuditStore } from "@entities/audit";
import type { AuditEventDto } from "@shared/api/gen/main/model";
import { formatter } from "@shared/lib/utils";
import { Col, Container, Spinner, Text } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useEffect } from "react";
import { FlatList, ListRenderItem, StyleSheet } from "react-native";

const renderEvent: ListRenderItem<AuditEventDto> = ({ item }) => (
  <Col bg={"surface"} radius={12} pa={12} gap={4}>
    <Text textStyle={"Body_M1"}>{agentAuditTitle(item) ?? item.type}</Text>
    <Text textStyle={"Caption_M1"} color={"textSecondary"}>
      {[formatter.date.format(item.createdAt), item.ip]
        .filter(Boolean)
        .join(" · ")}
    </Text>
    {!!item.userAgent && (
      <Text textStyle={"Caption_M1"} color={"textTertiary"} numberOfLines={1}>
        {item.userAgent}
      </Text>
    )}
  </Col>
);

/** Мой журнал безопасности: новые события сверху, подгрузка по курсору. */
export const Audit: FC = observer(() => {
  const auditStore = IAuditStore.useInstance();
  const holder = auditStore.eventsHolder;

  useEffect(() => {
    auditStore.load();
  }, [auditStore]);

  const onEndReached = useCallback(() => auditStore.loadMore(), [auditStore]);

  return (
    <Container>
      <FlatList
        data={auditStore.events}
        keyExtractor={item => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.content}
        refreshing={false}
        onRefresh={auditStore.load}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          holder.isLoading ? (
            <Spinner size={32} />
          ) : (
            <Text textAlign={"center"} color={"textSecondary"}>
              {holder.isError ? holder.error?.message : "Событий нет"}
            </Text>
          )
        }
        ListFooterComponent={
          holder.isLoadingMore ? <Spinner size={24} /> : null
        }
      />
    </Container>
  );
});

const styles = StyleSheet.create({ content: { padding: 8, gap: 8 } });
