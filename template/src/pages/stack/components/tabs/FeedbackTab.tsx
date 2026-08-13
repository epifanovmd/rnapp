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
import { StyleSheet } from "react-native";
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
        description={"Заглушка → контент; Group синхронизирует пульс блоков"}
      >
        <Button
          size={"small"}
          title={loading ? "Показать контент" : "Показать skeleton"}
          onPress={() => setLoading(current => !current)}
        />
        {loading ? (
          <Skeleton.Group>
            <Row gap={12} alignItems={"center"}>
              <Skeleton.Circle size={48} />
              <Col flex={1} gap={8}>
                <Skeleton width={"60%"} />
                <Skeleton width={"90%"} height={12} />
              </Col>
              <Skeleton width={64} height={32} borderRadius={16} />
            </Row>
          </Skeleton.Group>
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
        title={"Skeleton: шаблон поста"}
        description={"Шапка, Skeleton.Text, изображение, действия-пилюли"}
      >
        <Skeleton.Group>
          <Col gap={12}>
            <Row gap={10} alignItems={"center"}>
              <Skeleton.Circle size={36} />
              <Col flex={1} gap={6}>
                <Skeleton width={"45%"} height={12} />
                <Skeleton width={"25%"} height={10} />
              </Col>
            </Row>
            <Skeleton.Text lines={3} lastLineWidth={"40%"} />
            <Skeleton height={160} borderRadius={12} />
            <Row gap={8}>
              <Skeleton width={72} height={28} borderRadius={14} />
              <Skeleton width={72} height={28} borderRadius={14} />
              <Skeleton width={28} height={28} borderRadius={14} />
            </Row>
          </Col>
        </Skeleton.Group>
      </DemoSection>

      <DemoSection
        title={"Skeleton: грид и список"}
        description={"Медиа-грид из квадратов; ряды списка с иконками"}
      >
        <Skeleton.Group>
          <Col gap={16}>
            <Row gap={8}>
              <Skeleton flex={1} height={96} borderRadius={10} />
              <Skeleton flex={1} height={96} borderRadius={10} />
              <Skeleton flex={1} height={96} borderRadius={10} />
            </Row>
            {[0, 1, 2].map(index => (
              <Row key={index} gap={12} alignItems={"center"}>
                <Skeleton width={28} height={28} borderRadius={8} />
                <Skeleton flex={1} height={14} />
                <Skeleton width={40} height={14} />
              </Row>
            ))}
          </Col>
        </Skeleton.Group>
      </DemoSection>

      <DemoSection
        title={"Skeleton: произвольные формы"}
        description={
          "Любая форма через style; статичная подложка с вложенными блоками"
        }
      >
        <Skeleton.Group>
          <Row gap={12} alignItems={"flex-end"}>
            <Skeleton width={90} height={32} borderRadius={16} />
            <Skeleton width={64} height={64} style={styles.blob} />
            <Skeleton width={48} height={64} style={styles.tag} />
          </Row>
        </Skeleton.Group>
        <Skeleton animated={false} height={72} borderRadius={16}>
          <Skeleton.Group>
            <Row gap={12} alignItems={"center"} flex={1} ph={12}>
              <Skeleton.Circle size={40} />
              <Skeleton.Text flex={1} lines={2} lineHeight={10} gap={6} />
            </Row>
          </Skeleton.Group>
        </Skeleton>
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

const styles = StyleSheet.create({
  blob: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 32,
  },
  tag: {
    borderRadius: 8,
    borderBottomLeftRadius: 24,
  },
});
