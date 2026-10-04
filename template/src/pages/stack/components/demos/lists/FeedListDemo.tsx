import {
  AnchorList,
  anchorListPerf,
  IAnchorListProps,
  IAnchorListRenderItemProps,
} from "@epifanovmd/anchor-list";
import { Col } from "@shared/ui";
import React, { FC, memo, useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ESTIMATED_POST_HEIGHT, getFeed, IFeedPost } from "./feed-data";
import { FeedBenchmarkPanel } from "./FeedBenchmarkPanel";
import { FeedListHeader } from "./FeedListHeader";
import { FeedPostCard } from "./FeedPostCard";
import { IFeedBenchmarkSession, useFeedBenchmark } from "./useFeedBenchmark";

const keyExtractor = (post: IFeedPost) => post.id;

const renderItem = ({ item }: IAnchorListRenderItemProps<IFeedPost>) => (
  <FeedPostCard post={item} />
);

/**
 * Встроенный замер AnchorList на время прогона. Печатается только итог: отчёт
 * каждую секунду сам стоил бы кадров, которые меряются.
 */
const anchorPerfSession: IFeedBenchmarkSession = {
  start: label => {
    anchorListPerf.setSink((report, text) => {
      if (report.title === "итог") console.log(text);
    });
    anchorListPerf.start(label);
  },
  stop: () => anchorListPerf.stop(),
};

/** Экран: лента на 10 000 постов разной высоты на AnchorList с бенчмарком. */
export const FeedListDemo: FC = memo(() => {
  const { bottom } = useSafeAreaInsets();
  const feed = useMemo(getFeed, []);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const getScrollView = useCallback(
    () => scrollViewRef.current,
    [scrollViewRef],
  );
  const { drawDistance, listBackground, panel } = useFeedBenchmark(
    "AnchorList",
    getScrollView,
    anchorPerfSession,
  );

  return (
    <Col flex={1}>
      <FeedBenchmarkPanel {...panel} />
      <AnchorList
        refScrollView={
          scrollViewRef as unknown as IAnchorListProps<IFeedPost>["refScrollView"]
        }
        style={[styles.list, { backgroundColor: listBackground }]}
        data={feed}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        estimatedItemSize={ESTIMATED_POST_HEIGHT}
        recycleItems
        drawDistance={drawDistance}
        contentContainerStyle={{ paddingBottom: bottom + 4 }}
        ListHeaderComponent={<FeedListHeader list={"AnchorList"} />}
      />
    </Col>
  );
});

const styles = StyleSheet.create({
  list: { flex: 1 },
});
