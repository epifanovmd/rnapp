import {
  ActionSheet,
  Avatar,
  Button,
  Col,
  Row,
  Text,
  Touchable,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { useAvatarVM } from "../model/useAvatarVM";

export const AvatarPicker: FC = observer(() => {
  const {
    avatarUrl,
    avatarId,
    displayName,
    images,
    isBusy,
    sheetRef,
    sources,
    openSources,
    uploadFrom,
    selectImage,
    removeAvatar,
  } = useAvatarVM();

  return (
    <Col gap={12}>
      <Row gap={16} alignItems={"center"}>
        <Avatar size={80} url={avatarUrl} name={displayName} />
        <Col flex={1} gap={8}>
          <Button size={"small"} loading={isBusy} onPress={openSources}>
            {"Загрузить новое фото"}
          </Button>
          {!!avatarId && (
            <Button
              size={"small"}
              variant={"danger"}
              appearance={"ghost"}
              disabled={isBusy}
              onPress={removeAvatar}
            >
              {"Убрать аватар"}
            </Button>
          )}
        </Col>
      </Row>

      {images.length > 0 && (
        <Col gap={8}>
          <Text textStyle={"Body_S2"} color={"textSecondary"}>
            {"Или выберите из загруженных изображений"}
          </Text>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.images}
          >
            {images.map(image => (
              <Touchable
                key={image.id}
                disabled={isBusy || image.id === avatarId}
                opacity={image.id === avatarId ? 0.4 : 1}
                onPress={() => selectImage(image.id)}
              >
                <Avatar
                  size={56}
                  borderRadius={8}
                  url={image.thumbnailUrl ?? image.url ?? undefined}
                  name={image.name}
                />
              </Touchable>
            ))}
          </ScrollView>
        </Col>
      )}

      <ActionSheet
        ref={sheetRef}
        title={"Новое фото"}
        items={sources}
        onSelect={uploadFrom}
      />
    </Col>
  );
});

const styles = StyleSheet.create({ images: { gap: 8 } });
