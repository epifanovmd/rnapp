import { FILE_PERMISSIONS, IFileStore } from "@entities/file";
import { IUserStore } from "@entities/user";
import { useDeleteFile } from "@features/delete-file";
import { FileUploadActions } from "@features/file-upload";
import type { IFileDto } from "@shared/api/gen/main/model";
import {
  Button,
  Col,
  Container,
  Segmented,
  SegmentedOption,
  Spinner,
  Text,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useEffect } from "react";
import { FlatList, ListRenderItem, StyleSheet } from "react-native";

import { FileRow } from "./FileRow";

const keyExtractor = (file: IFileDto) => file.id;

type TFilesScope = "mine" | "all";

const SCOPE_OPTIONS: SegmentedOption<TFilesScope>[] = [
  { value: "mine", label: "Мои" },
  { value: "all", label: "Все" },
];

/**
 * Файлы: свои или (с правом `file:view` на все) все, загрузка и удаление.
 * Кнопка удаления — только у файлов, которые право `file:delete` позволяет удалить.
 */
export const Files: FC = observer(() => {
  const fileStore = IFileStore.useInstance();
  const userStore = IUserStore.useInstance();
  const deleteFile = useDeleteFile();
  const holder = fileStore.filesHolder;
  const canViewAll = userStore.scope(FILE_PERMISSIONS.VIEW) === "all";

  useEffect(() => {
    fileStore.load();

    // Список всех файлов — только на этом экране; выбор аватара берёт свои.
    return () => {
      fileStore.setMine(true);
    };
  }, [fileStore]);

  const onScopeChange = useCallback(
    (scope: TFilesScope) => fileStore.setMine(scope === "mine"),
    [fileStore],
  );

  const onDelete = useCallback(
    (file: IFileDto) => {
      deleteFile(file);
    },
    [deleteFile],
  );

  const renderItem = useCallback<ListRenderItem<IFileDto>>(
    ({ item }) => (
      <FileRow
        file={item}
        onDelete={
          userStore.canOn(FILE_PERMISSIONS.DELETE, [item.ownerId])
            ? onDelete
            : undefined
        }
      />
    ),
    [onDelete, userStore],
  );

  return (
    <Container>
      <FlatList
        data={fileStore.files}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        extraData={userStore.permissions}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Col gap={8}>
            {canViewAll && (
              <Segmented
                options={SCOPE_OPTIONS}
                value={fileStore.mine ? "mine" : "all"}
                onValueChange={onScopeChange}
              />
            )}
            <FileUploadActions />
          </Col>
        }
        refreshing={holder.isRefreshing}
        onRefresh={fileStore.refresh}
        onEndReached={fileStore.loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          holder.isLoading ? (
            <Spinner size={32} />
          ) : (
            <Text textAlign={"center"} color={"textSecondary"}>
              {holder.isError ? holder.error?.message : "Файлов нет"}
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
              onPress={fileStore.loadMore}
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
