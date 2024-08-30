import { Col, HoldItem } from "@force-dev/react-mobile";
import { observer } from "mobx-react-lite";
import React, { FC, PropsWithChildren, useCallback, useMemo } from "react";

import { PostModel } from "~@models";

import { Text } from "../ui";

interface IProps {
  post: PostModel;
  onPress?: (id: number) => void;
}

export const Post: FC<PropsWithChildren<IProps>> = observer(
  ({ post, onPress }) => {
    const handlePress = useCallback(() => {
      if (post.data) {
        onPress?.(post.data?.id);
      }
    }, [onPress, post.data]);

    const holdMenu = useMemo(
      () => [
        {
          text: "Удалить",
          variants: [
            {
              text: "Пост будет удален безвозвратно",
              isTitle: true,
            },
            {
              text: "Удалить",
              isDestructive: true,
              onPress: () => {},
            },
          ],
          isDestructive: true,
        },
      ],
      [],
    );

    return (
      <HoldItem items={holdMenu} onPress={handlePress}>
        <Col mv={8} bg={"gray"} radius={10} pa={6}>
          <Text fontWeight={"bold"}>{post.data?.title}</Text>
          <Text>{post.data?.tags}</Text>
          <Text>{post.data?.body}</Text>
        </Col>
      </HoldItem>
    );
  },
);
