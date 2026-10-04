import { useTheme } from "@shared/lib/theme";
import { Avatar, Col, Icon, Row, Tag, Text } from "@shared/ui";
import React, { FC, memo } from "react";

import { formatPostAge, IFeedPost } from "./feed-data";

interface IFeedPostCardProps {
  post: IFeedPost;
}

/**
 * Карточка поста ленты: автор и время, текст, метки, счётчики. Отступы до
 * соседей — внутри непрозрачной ячейки, без `gap` списка: в режиме «Пустоты»
 * фон списка виден только там, где ячейка не отрисована.
 */
export const FeedPostCard: FC<IFeedPostCardProps> = memo(({ post }) => {
  const { colors } = useTheme();

  return (
    <Col bg={"background"} ph={16} pb={12}>
      <Col bg={"surface"} radius={16} pa={14} gap={10}>
        <Row alignItems={"center"} gap={10}>
          <Avatar name={post.author} size={36} />
          <Col flex={1}>
            <Text textStyle={"Title_S2"} numberOfLines={1}>
              {post.author}
            </Text>
            <Text textStyle={"Caption_M3"} color={"textTertiary"}>
              {formatPostAge(post.minutesAgo)}
            </Text>
          </Col>
        </Row>

        <Text textStyle={"Body_M2"}>{post.text}</Text>

        {post.tags.length > 0 && (
          <Row wrap gap={6}>
            {post.tags.map(tag => (
              <Tag key={tag} variant={"secondary"}>
                {`#${tag}`}
              </Tag>
            ))}
          </Row>
        )}

        <Row gap={16}>
          <Row alignItems={"center"} gap={4}>
            <Icon name={"zap"} size={16} color={colors.textSecondary} />
            <Text textStyle={"Caption_M2"} color={"textSecondary"}>
              {String(post.likes)}
            </Text>
          </Row>
          <Row alignItems={"center"} gap={4}>
            <Icon name={"scrollText"} size={16} color={colors.textSecondary} />
            <Text textStyle={"Caption_M2"} color={"textSecondary"}>
              {String(post.comments)}
            </Text>
          </Row>
        </Row>
      </Col>
    </Col>
  );
});
