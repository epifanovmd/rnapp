import { observer } from "mobx-react-lite";
import React, { FC, useEffect } from "react";

import {
  Container,
  Content,
  Header,
  PostList,
  useAnimationHeader,
} from "~@components";

import { AppScreenProps } from "../../../navigation";
import { usePostsVM } from "./hooks";

export const Posts: FC<AppScreenProps> = observer(() => {
  const { loading, list, onRefresh, onLoadMore } = usePostsVM();
  const { onScroll, animatedValue } = useAnimationHeader();

  useEffect(() => {
    onRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
