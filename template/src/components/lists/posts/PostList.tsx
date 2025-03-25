import { Row } from "@force-dev/react-mobile";
import { observer } from "mobx-react-lite";
import React, { FC, PropsWithChildren, useCallback, useMemo } from "react";
import { ListRenderItemInfo } from "react-native";
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

    return (
      <RefreshingContainer.FlatList
        refreshing={refreshing}
        onRefresh={onRefresh}
        data={data.map((item, index) =>
          index === 0
            ? new PostModel({
                id: 1223324324,
                body:
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, nisi eget consectetur fermentum, nisi nulla cursus sapien, a dictum odio turpis nec libero. Aenean at felis vel lacus malesuada cursus ac a neque. Integer et enim eget turpis dictum varius. Donec consectetur quam sed erat tincidunt, ut elementum mauris ultricies. Sed at felis velit. Nulla facilisi. Duis euismod, nunc vel tincidunt hendrerit, lacus sapien tincidunt felis, ut tincidunt mauris nisl ut nulla. Integer auctor, velit in volutpat aliquet, libero magna volutpat lacus, nec dapibus est risus at lacus.\n" +
                  "\n" +
                  "Curabitur vestibulum, nisi nec consequat pharetra, felis elit laoreet nulla, eget vehicula mi felis sed mauris. Donec in odio non purus fermentum fringilla. Cras vitae scelerisque lectus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Ut facilisis purus sed mauris pharetra, id tincidunt mauris facilisis. Vestibulum dapibus dui et risus venenatis, sed imperdiet neque interdum. Nulla facilisi. Duis non diam sit amet libero euismod convallis. Suspendisse potenti. Integer congue diam a arcu pellentesque, in tincidunt dui dapibus. Nam sed arcu non lacus laoreet feugiat non sed lacus. Integer ut magna erat.\n" +
                  "\n" +
                  "Maecenas tincidunt libero vel nisi sollicitudin, in tincidunt risus feugiat. Morbi sed libero et turpis varius consectetur. Vestibulum eget est sit amet magna cursus fermentum non in eros. Suspendisse potenti. Nam auctor lorem at elit convallis, a egestas velit placerat. Pellentesque non nulla at magna tristique rhoncus. Etiam sit amet nisl et arcu fermentum bibendum. Sed non sapien quis ligula tincidunt faucibus. Nulla facilisi. Phasellus vehicula, felis in efficitur pretium, justo orci ultricies elit, eget pellentesque erat mi id justo.\n" +
                  "\n" +
                  "Ut et risus in dolor maximus convallis. Phasellus ornare, mi vel feugiat interdum, turpis sapien iaculis augue, et consequat velit tortor et odio. Nulla sed lorem vitae lectus bibendum elementum. Integer convallis urna sit amet metus venenatis, et euismod libero volutpat. Ut et mi auctor, tempus velit sit amet, consectetur justo. Nunc eget dolor id arcu hendrerit ullamcorper. Vestibulum laoreet bibendum ligula, at vulputate libero tempor nec. Proin efficitur, odio non dapibus malesuada, arcu sapien tristique lorem, eget egestas tortor nisi sed nunc. Vestibulum ut orci id justo tristique tristique. Nam imperdiet velit eget nulla sagittis scelerisque.\n" +
                  "\n" +
                  "Donec ut felis non felis vehicula convallis id vel ex. Vestibulum scelerisque urna in dolor gravida, ut condimentum metus mattis. Fusce ut tortor sed erat scelerisque auctor. Nullam at ligula nec eros facilisis cursus. Integer nec dapibus nisi. Mauris at lectus nec quam maximus auctor non eu velit. Suspendisse potenti. Vestibulum volutpat nunc nec metus vehicula, nec fermentum orci scelerisque.",
                tags: [],
                title: "1232432",
                userId: 122133,
                reactions: {
                  dislikes: 1,
                  likes: 1,
                },
                views: 1,
              })
            : item,
        )}
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
