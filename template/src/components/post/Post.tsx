import { Col, HoldItem } from "@force-dev/react-mobile";
import React, { FC, memo, PropsWithChildren, useMemo } from "react";

import { PostModel } from "../../models";
import { Text } from "../ui";

interface IProps {
  post: PostModel;
}

export const Post: FC<PropsWithChildren<IProps>> = memo(({ post }) => {
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
    <HoldItem items={holdMenu}>
      <Col mv={8} bg={"gray"} radius={10} pa={6}>
        <Text fontWeight={"bold"}>{post.data.title}</Text>
        <Text>{post.data.tags}</Text>
        <Text>{post.data.body}</Text>
      </Col>
    </HoldItem>
  );
});
