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
        description={`Набор Icon — ${ICON_NAMES.length} шт., проп name типизирован (TIconName)`}
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
        title={"Размер и цвет"}
        description={"width/height и color управляют размером и цветом"}
      >
        <Row alignItems={"center"} gap={16}>
          <Icon name={"settings"} width={16} height={16} />
          <Icon name={"settings"} />
          <Icon name={"settings"} width={32} height={32} />
          <Icon
            name={"settings"}
            width={40}
            height={40}
            color={colors.primary}
          />
          <Icon
            name={"settings"}
            width={40}
            height={40}
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
