import { Col, Row } from "@force-dev/react-mobile";
import { observer } from "mobx-react-lite";
import React, { FC, PropsWithChildren, useCallback, useMemo } from "react";
import { ListRenderItemInfo } from "react-native";
import { NativeScrollEvent } from "react-native/Libraries/Components/ScrollView/ScrollView";
import { NativeSyntheticEvent } from "react-native/Libraries/Types/CoreEventTypes";

import { PostModel } from "../../../models";
import { RefreshingContainer } from "../../layouts/RefreshingContainer";
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
      (item: PostModel) => item.data.id.toString(),
      [],
    );
    const renderItem = useCallback(
      ({ item }: ListRenderItemInfo<PostModel>) => (
        <Col mv={8} bg={"gray"} radius={10} pa={6}>
          <Text fontWeight={"bold"}>{item.data.title}</Text>
          <Text>{item.data.tags}</Text>
          <Text>{item.data.body}</Text>
        </Col>
      ),
      [],
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
