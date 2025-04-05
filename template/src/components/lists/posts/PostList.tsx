import { Row } from "@force-dev/react-mobile";
import { PostModel } from "@models";
import { observer } from "mobx-react-lite";
import React, { FC, PropsWithChildren, useCallback, useMemo } from "react";
import { ListRenderItemInfo } from "react-native";
import { NativeScrollEvent } from "react-native/Libraries/Components/ScrollView/ScrollView";
import { NativeSyntheticEvent } from "react-native/Libraries/Types/CoreEventTypes";

import { useNavigation } from "../../../navigation";
import { RefreshingContainer } from "../../layouts/RefreshingContainer";
import { Post } from "../../post";
import { Text, Title } from "../../ui";

interface IProps {
  data: PostModel[];
  refreshing?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  onScroll?:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;
}

export const PostList: FC<PropsWithChildren<IProps>> = observer(
  ({ data, refreshing, onRefresh, onLoadMore, onScroll }) => {
    const keyExtractor = useCallback(
      (item: PostModel) => item.data?.id.toString() ?? "",
      [],
    );

    const { navigate } = useNavigation();

    const handlePress = useCallback(
      (id: number) => {
        navigate({ name: "Post", params: { id } });
      },
      [navigate],
    );

    const renderItem = useCallback(
      ({ item }: ListRenderItemInfo<PostModel>) => (
        <Post post={item} onPress={handlePress} />
      ),
      [handlePress],
    );

    const listHeaderComponent = useMemo(
      () => (
        <Row>
          <Title />
        </Row>
      ),
      [],
    );
    const listEmptyComponent = useMemo(
      () => (
        <Row>
          <Text>{"Empty"}</Text>
        </Row>
      ),
      [],
    );
    const listFooterComponent = useMemo(
      () => (
        <Row>
          <Text>{"Footer"}</Text>
        </Row>
      ),
      [],
    );

    return (
      <RefreshingContainer.FlatList
        contentContainerStyle={{ paddingTop: 200 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        data={data}
        onScroll={onScroll}
        onEndReached={onLoadMore}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeaderComponent}
        ListEmptyComponent={listEmptyComponent}
        ListFooterComponent={listFooterComponent}
        renderItem={renderItem}
      />
    );
  },
);
