import { IFileStore } from "@entities/file";
import { FileUploadActions } from "@features/file-upload";
import type { IFileDto } from "@shared/api/gen/main/model";
import { formatter } from "@shared/lib/utils";
import { Avatar, Button, Col, Container, Row, Spinner, Text } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useEffect } from "react";
import { Alert, FlatList, StyleSheet } from "react-native";

const FileRow: FC<{ file: IFileDto; onDelete: (file: IFileDto) => void }> = ({
  file,
  onDelete,
}) => (
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
    <Button
      size={"small"}
      variant={"danger"}
      appearance={"ghost"}
      onPress={() => onDelete(file)}
    >
      {"Удалить"}
    </Button>
  </Row>
);

/** Мои файлы: список страницами, загрузка и удаление. */
export const Files: FC = observer(() => {
  const fileStore = IFileStore.useInstance();
  const holder = fileStore.filesHolder;

  useEffect(() => {
    fileStore.load();
  }, [fileStore]);

  const onDelete = useCallback(
    (file: IFileDto) =>
      Alert.alert("Удалить файл?", file.name, [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => fileStore.remove(file.id),
        },
      ]),
    [fileStore],
  );

  return (
    <Container>
      <FlatList
        data={fileStore.files}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <FileRow file={item} onDelete={onDelete} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<FileUploadActions />}
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
