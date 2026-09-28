import { useTheme } from "@shared/lib/theme";
import { Col, Icon, ICON_NAMES, Row, Text } from "@shared/ui";
import React, { FC, memo } from "react";
import { StyleSheet, View } from "react-native";

import { DemoScreen, DemoSection } from "./DemoScreen";

export const IconsTab: FC = memo(() => {
  const { colors } = useTheme();

  return (
    <DemoScreen>
      <DemoSection
        title={"Иконки"}
        description={`Реестр lucide + кастомные (checkBold) — ${ICON_NAMES.length} шт.; name типизирован (TIconName)`}
      >
        <Row flexWrap={"wrap"} gap={12}>
          {ICON_NAMES.map(name => (
            <Col key={name} alignItems={"center"} gap={4} style={styles.cell}>
              <View
                style={[styles.tile, { backgroundColor: colors.onSurface }]}
              >
                <Icon name={name} />
              </View>
              <Text textStyle={"Caption_M3"} color={"textSecondary"}>
                {name}
              </Text>
            </Col>
          ))}
        </Row>
      </DemoSection>

      <DemoSection
        title={"Размер, цвет, обводка"}
        description={"size, color и strokeWidth (толщина lucide-обводки)"}
      >
        <Row alignItems={"center"} gap={16}>
          <Icon name={"settings"} size={16} />
          <Icon name={"settings"} />
          <Icon name={"settings"} size={32} />
          <Icon name={"settings"} size={40} color={colors.primary} />
          <Icon name={"settings"} size={40} strokeWidth={1} />
          <Icon
            name={"settings"}
            size={40}
            strokeWidth={2.5}
            color={colors.danger}
          />
        </Row>
      </DemoSection>
    </DemoScreen>
  );
});

const styles = StyleSheet.create({
  cell: {
    width: 72,
  },
  tile: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
