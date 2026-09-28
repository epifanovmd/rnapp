import { IJobStore, JOB_PERMISSIONS } from "@entities/job";
import { IUserStore } from "@entities/user";
import { notifyApiError } from "@shared/lib/http";
import { useNotifications } from "@shared/lib/notifications";
import {
  Button,
  Col,
  Container,
  Row,
  Section,
  Spinner,
  Text,
  TextField,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet } from "react-native";

import { JobRow } from "./JobRow";

/** Запуск демо-задачи `demo.echo` внешнему воркеру (право `jobs:demo`). */
const DemoJobLauncher: FC = observer(() => {
  const jobStore = IJobStore.useInstance();
  const notifications = useNotifications();
  const [text, setText] = useState("Привет, воркер!");
  const [isStarting, setStarting] = useState(false);

  const start = useCallback(async () => {
    setStarting(true);
    const res = await jobStore.startDemoEcho(text);

    setStarting(false);

    if (res.error) notifyApiError(notifications, res.error);
  }, [jobStore, notifications, text]);

  return (
    <Section
      title={"Демо-задача"}
      description={"demo.echo — проверка, что внешние воркеры подключены."}
      mb={8}
    >
      <Row gap={8} alignItems={"center"}>
        <Col flex={1}>
          <TextField label={"Текст"} value={text} onChangeText={setText} />
        </Col>
        <Button
          size={"small"}
          loading={isStarting}
          disabled={!text.trim()}
          onPress={start}
        >
          {"Запустить"}
        </Button>
      </Row>
    </Section>
  );
});

/** Фоновые задачи пользователя; статусы обновляются по сокету `job:updated`. */
export const Jobs: FC = observer(() => {
  const jobStore = IJobStore.useInstance();
  // Демо-задачу сервер ставит только по праву jobs:demo.
  const canRunDemo = IUserStore.useInstance().can(JOB_PERMISSIONS.DEMO);
  const notifications = useNotifications();
  const holder = jobStore.jobsHolder;

  useEffect(() => {
    jobStore.load();
  }, [jobStore]);

  const onCancel = useCallback(
    async (id: string) => {
      const res = await jobStore.cancel(id);

      if (res.error) notifyApiError(notifications, res.error);
    },
    [jobStore, notifications],
  );

  return (
    <Container>
      <FlatList
        data={jobStore.jobs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <JobRow job={item} onCancel={onCancel} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={canRunDemo ? <DemoJobLauncher /> : null}
        refreshing={holder.isRefreshing}
        onRefresh={jobStore.refresh}
        onEndReached={jobStore.loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          holder.isLoading ? (
            <Spinner size={32} />
          ) : (
            <Text textAlign={"center"} color={"textSecondary"}>
              {holder.isError ? holder.error?.message : "Задач нет"}
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
