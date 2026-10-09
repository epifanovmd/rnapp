import { FILE_PERMISSIONS, IFileStore } from "@entities/file";
import { IUserStore } from "@entities/user";
import { FileUploadActions } from "@features/file-upload";
import type { IFileDto } from "@shared/api/gen/main/model";
import { notifyApiError } from "@shared/lib/http";
import { useNotifications } from "@shared/lib/notifications";
import { formatter } from "@shared/lib/utils";
import {
  Avatar,
  Button,
  Col,
  Container,
  Row,
  Segmented,
  SegmentedOption,
  Spinner,
  Text,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, memo, useCallback, useEffect } from "react";
import { Alert, FlatList, ListRenderItem, StyleSheet } from "react-native";

const keyExtractor = (file: IFileDto) => file.id;

type TFilesScope = "mine" | "all";

const SCOPE_OPTIONS: SegmentedOption<TFilesScope>[] = [
  { value: "mine", label: "Мои" },
  { value: "all", label: "Все" },
];

const FileRow: FC<{
  file: IFileDto;
  onDelete?: (file: IFileDto) => void;
}> = memo(({ file, onDelete }) => (
  <Row bg={"surface"} radius={12} pa={12} gap={12} alignItems={"center"}>
    <Avatar
      size={48}
      borderRadius={8}
      url={file.thumbnailUrl ?? undefined}
      name={file.name}
    />
    <Col flex={1} gap={2}>
      <Text textStyle={"Body_M1"} numberOfLines={1}>
        {file.name}
      </Text>
      <Text textStyle={"Caption_M1"} color={"textSecondary"}>
        {[file.type, formatter.bytes(file.size), file.status].join(" · ")}
      </Text>
    </Col>
    {onDelete && (
      <Button
        size={"small"}
        variant={"danger"}
        appearance={"ghost"}
        onPress={() => onDelete(file)}
      >
        {"Удалить"}
      </Button>
    )}
  </Row>
));

/**
 * Файлы: свои или (с правом `file:view` на все) все, загрузка и удаление.
 * Кнопка удаления — только у файлов, которые право `file:delete` позволяет удалить.
 */
export const Files: FC = observer(() => {
  const fileStore = IFileStore.useInstance();
  const userStore = IUserStore.useInstance();
  const notifications = useNotifications();
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

  const remove = useCallback(
    async (file: IFileDto) => {
      const res = await fileStore.remove(file.id);

      if (res.error) notifyApiError(notifications, res.error);
    },
    [fileStore, notifications],
  );

  const onDelete = useCallback(
    (file: IFileDto) =>
      Alert.alert("Удалить файл?", file.name, [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => remove(file),
        },
      ]),
    [remove],
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
          holder.isLoadingMore ? <Spinner size={24} /> : null
        }
      />
    </Container>
  );
});

const styles = StyleSheet.create({ content: { padding: 8, gap: 8 } });
