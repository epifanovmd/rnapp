import { StackProps } from "@core";
import {
  CameraRoll,
  PhotoIdentifier,
} from "@react-native-camera-roll/camera-roll";
import { FlashList } from "@shopify/flash-list";
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Image, PermissionsAndroid, Platform } from "react-native";

const FIRST_IMAGE_SIZE = 50;

const GalleryItem: FC<{ item: PhotoIdentifier }> = memo(({ item }) => {
  return (
    <Image
      source={{ uri: item.node.image.uri }}
      style={{ width: 100, height: 100, margin: 2, backgroundColor: "gray" }}
      resizeMode="cover"
    />
  );
});

export const Gallery: FC<StackProps> = memo(({ route }) => {
  const [photos, setPhotos] = useState<PhotoIdentifier[]>([]);
  const loading = useRef<boolean>(false);
  const hasNextPage = useRef<boolean>(true);
  const afterCursor = useRef<string | undefined>(undefined);
  const isMounted = useRef<boolean>(true);

  useEffect(() => {
    requestPermission();

    return () => {
      isMounted.current = false; // При размонтировании меняем флаг на false
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestPermission = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES ||
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn("Доступ к фото запрещен");

        return;
      }
    }
    await loadInitialPhotos();
  };

  const loadInitialPhotos = async () => {
    try {
      const result = await CameraRoll.getPhotos({
        first: FIRST_IMAGE_SIZE,
        assetType: "Photos",
      });

      if (isMounted.current) {
        setPhotos(result.edges);
        afterCursor.current = result.page_info.end_cursor;
        hasNextPage.current = result.page_info.has_next_page;
        loadRemainingPhotos();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadRemainingPhotos = async () => {
    if (loading.current || !hasNextPage.current) return;

    loading.current = true;

    try {
      let currentCursor = afterCursor.current;

      while (currentCursor && hasNextPage.current && isMounted.current) {
        const result = await CameraRoll.getPhotos({
          first: FIRST_IMAGE_SIZE * 4,
          assetType: "Photos",
          after: currentCursor,
        });

        if (isMounted.current) {
          setPhotos(prevPhotos => [...prevPhotos, ...result.edges]);
        }

        afterCursor.current = result.page_info.end_cursor;
        hasNextPage.current = result.page_info.has_next_page;
        currentCursor = result.page_info.end_cursor;
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (isMounted.current) {
        loading.current = false;
      }
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: PhotoIdentifier }) => <GalleryItem item={item} />,
    [],
  );

  return (
    <FlashList
      data={photos}
      keyExtractor={item => item.node.id}
      numColumns={3}
      renderItem={renderItem}
      estimatedItemSize={100} // Оптимизация для быстрого рендеринга
    />
  );
});
