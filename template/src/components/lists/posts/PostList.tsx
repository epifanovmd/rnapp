import { Col, Row } from "@force-dev/react-mobile";
import { observer } from "mobx-react-lite";
import React, { FC, PropsWithChildren, useCallback, useMemo } from "react";
import { ListRenderItemInfo, SafeAreaView } from "react-native";
import { NativeScrollEvent } from "react-native/Libraries/Components/ScrollView/ScrollView";
import { NativeSyntheticEvent } from "react-native/Libraries/Types/CoreEventTypes";

import { PostModel } from "~@models";

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

    // return (
    //   <SafeAreaView style={{ flex: 1 }}>
    //     <Col flex={1} bg={"red"}>
    //       <Col>
    //         <Col height={100} bg={"yellow"}></Col>
    //         <Col>
    //           <Text>1234</Text>
    //         </Col>
    //       </Col>
    //     </Col>
    //   </SafeAreaView>
    // );

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
