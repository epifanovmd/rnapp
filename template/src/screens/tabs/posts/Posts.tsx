import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import {
  Container,
  Content,
  Header,
  PostList,
  useAnimationHeader,
} from "../../../components";
import { AppScreenProps } from "../../../navigation";
import { usePostsVM } from "./hooks";

export const Posts: FC<AppScreenProps> = observer(() => {
  const { loading, list, onRefresh, onLoadMore } = usePostsVM();
  const { onScroll, animatedValue } = useAnimationHeader();

  return (
    <Container safeAreBottom={false}>
      <Header animatedValue={animatedValue} />
      <Content>
        <PostList
          data={list}
          onRefresh={onRefresh}
          onLoadMore={onLoadMore}
          refreshing={loading}
          onScroll={onScroll}
        />
      </Content>
    </Container>
  );
});
