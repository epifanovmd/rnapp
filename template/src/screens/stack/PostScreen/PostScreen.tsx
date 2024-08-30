import { StackScreenProps } from "@react-navigation/stack";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useEffect } from "react";

import {
  Container,
  Content,
  Header,
  Post,
  PostList,
  Text,
  useAnimationHeader,
} from "~@components";

import { AppScreenProps, StackProps, useNavigation } from "../../../navigation";
import { usePostVM } from "./hooks";

export const PostScreen: FC<StackProps<"Post">> = observer(
  ({
    route: {
      params: { id },
    },
  }) => {
    const { model, onRefresh } = usePostVM(id);
    const { onScroll, animatedValue } = useAnimationHeader();

    useEffect(() => {
      onRefresh().then();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <Container safeAreBottom={false}>
        <Header />
        <Content>{model && <Post post={model} />}</Content>
      </Container>
    );
  },
);
