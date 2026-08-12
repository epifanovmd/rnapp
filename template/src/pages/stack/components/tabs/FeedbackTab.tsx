import {
  AnimatedRefreshing,
  Avatar,
  Badge,
  Button,
  Col,
  Icon,
  ProgressBar,
  Row,
  Skeleton,
  Text,
} from "@shared/ui";
import React, { FC, memo, useState } from "react";
import { useSharedValue, withTiming } from "react-native-reanimated";

import { DemoScreen, DemoSection } from "./DemoScreen";

export const FeedbackTab: FC = memo(() => {
  const [progress, setProgress] = useState(0.3);
  const [loading, setLoading] = useState(true);
  const percentage = useSharedValue(70);

  return (
    <DemoScreen>
      <DemoSection
        title={"ProgressBar"}
        description={"determinate / indeterminate, цвет и высота"}
      >
        <ProgressBar progress={progress} />
        <ProgressBar progress={progress} color={"success"} height={10} />
        <ProgressBar indeterminate />
        <Row gap={8}>
          <Button
            flex={1}
            size={"small"}
            title={"-10%"}
            onPress={() => setProgress(current => Math.max(0, current - 0.1))}
          />
          <Button
            flex={1}
            size={"small"}
            title={"+10%"}
            onPress={() => setProgress(current => Math.min(1, current + 0.1))}
          />
        </Row>
      </DemoSection>

      <DemoSection
        title={"Skeleton"}
        description={"Пульсирующие заглушки; собранный шаблон карточки"}
      >
        <Button
          size={"small"}
          title={loading ? "Показать контент" : "Показать skeleton"}
          onPress={() => setLoading(current => !current)}
        />
        {loading ? (
          <Row gap={12} alignItems={"center"}>
            <Skeleton circle width={48} />
            <Col flex={1} gap={8}>
              <Skeleton width={"60%"} />
              <Skeleton width={"90%"} height={12} />
            </Col>
          </Row>
        ) : (
          <Row gap={12} alignItems={"center"}>
            <Avatar name={"Иван Петров"} size={48} />
            <Col flex={1}>
              <Text textStyle={"Body_S1"}>Иван Петров</Text>
              <Text color={"textSecondary"} textStyle={"Caption_M3"}>
                Контент загружен
              </Text>
            </Col>
          </Row>
        )}
      </DemoSection>

      <DemoSection
        title={"Badge"}
        description={"Счётчик с max, dot-режим, варианты, поверх контента"}
      >
        <Row gap={16} alignItems={"center"}>
          <Badge count={3} />
          <Badge count={120} variant={"primary"} />
          <Badge dot variant={"success"} />
          <Badge count={7} variant={"warning"}>
            <Icon name={"document"} width={32} height={32} />
          </Badge>
          <Badge dot>
            <Icon name={"settings"} width={32} height={32} />
          </Badge>
        </Row>
      </DemoSection>

      <DemoSection
        title={"Avatar"}
        description={"url / инициалы, размер, online-статус, скругление"}
      >
        <Row gap={12} alignItems={"flex-end"}>
          <Avatar name={"Анна Каренина"} size={32} />
          <Avatar name={"Boris Godunov"} online />
          <Avatar
            url={"https://i.pravatar.cc/96?img=5"}
            name={"Мария"}
            size={56}
            online={false}
          />
          <Avatar name={"Квадратный"} size={56} borderRadius={12} />
        </Row>
      </DemoSection>

      <DemoSection
        title={"AnimatedRefreshing"}
        description={"Круговой прогресс на shared value (0..100)"}
      >
        <Row gap={16} alignItems={"center"}>
          <AnimatedRefreshing percentage={percentage} />
          <Button
            size={"small"}
            title={"Случайный прогресс"}
            onPress={() => {
              percentage.value = withTiming(Math.random() * 100);
            }}
          />
        </Row>
      </DemoSection>
    </DemoScreen>
  );
});
