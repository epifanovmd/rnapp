import { IJobStore, JOB_PERMISSIONS } from "@entities/job";
import { IUserStore } from "@entities/user";
import { useCancelJob } from "@features/cancel-job";
import { DemoJobLauncher } from "@features/start-demo-job";
import type { JobRunDto } from "@shared/api/gen/main/model";
import { Button, Container, Spinner, Text } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useEffect } from "react";
import { FlatList, ListRenderItem, StyleSheet } from "react-native";

import { JobRow } from "./JobRow";

const keyExtractor = (job: JobRunDto) => job.id;

/** Фоновые задачи пользователя; статусы обновляются по сокету `job:updated`. */
export const Jobs: FC = observer(() => {
  const jobStore = IJobStore.useInstance();
  // Демо-задачу сервер ставит только по праву jobs:demo.
  const canRunDemo = IUserStore.useInstance().can(JOB_PERMISSIONS.DEMO);
  const cancelJob = useCancelJob();
  const holder = jobStore.jobsHolder;

  useEffect(() => {
    jobStore.load();
  }, [jobStore]);

  const onCancel = useCallback(
    (id: string) => {
      cancelJob(id);
    },
    [cancelJob],
  );

  const renderItem = useCallback<ListRenderItem<JobRunDto>>(
    ({ item }) => <JobRow job={item} onCancel={onCancel} />,
    [onCancel],
  );

  return (
    <Container>
      <FlatList
        data={jobStore.jobs}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
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
          holder.isLoadingMore ? (
            <Spinner size={24} />
          ) : holder.isLoadMoreError ? (
            <Button
              size={"small"}
              appearance={"ghost"}
              onPress={jobStore.loadMore}
            >
              {"Не удалось загрузить — повторить"}
            </Button>
          ) : null
        }
      />
    </Container>
  );
});

const styles = StyleSheet.create({ content: { padding: 8, gap: 8 } });
