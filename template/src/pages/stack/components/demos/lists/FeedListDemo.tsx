import {
  AnchorList,
  IAnchorListRenderItemProps,
} from "@epifanovmd/anchor-list";
import { Text } from "@shared/ui";
import React, { FC, memo, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FEED_SIZE, getFeed, IFeedPost } from "./feed-data";
import { FeedPostCard } from "./FeedPostCard";

/** Средняя высота карточки: шапка, 1–5 строк текста, метки, счётчики. */
const ESTIMATED_POST_HEIGHT = 170;

const keyExtractor = (post: IFeedPost) => post.id;

const renderItem = ({ item }: IAnchorListRenderItemProps<IFeedPost>) => (
  <FeedPostCard post={item} />
);

/** Лента на 10 000 постов разной высоты — нагрузочный пример AnchorList. */
export const FeedListDemo: FC = memo(() => {
  const { bottom } = useSafeAreaInsets();
  const feed = useMemo(getFeed, []);

  return (
    <AnchorList
      style={styles.list}
      data={feed}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      estimatedItemSize={ESTIMATED_POST_HEIGHT}
      gap={12}
      contentContainerStyle={[styles.content, { paddingBottom: bottom + 16 }]}
      ListHeaderComponent={
        <Text textStyle={"Body_M1"} color={"textSecondary"}>
          {`Лента · ${FEED_SIZE.toLocaleString("ru-RU")} постов разной высоты`}
        </Text>
      }
    />
  );
});

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingTop: 8, paddingHorizontal: 16 },
});
