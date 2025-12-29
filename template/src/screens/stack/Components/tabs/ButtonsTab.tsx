import { Button, Col, Row, ScrollView, SwitchTheme } from "@components";
import { TabProps, useTransition } from "@core";
import { memo, useCallback } from "react";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ButtonsTab = memo<TabProps>(() => {
  const { bottom } = useSafeAreaInsets();
  const { onScroll, navbarHeight } = useTransition();

  const onPress = useCallback(() => {
    console.log("Press button");
  }, []);

  return (
    <Col gap={8}>
      <Animated.ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: 8,
          paddingBottom: bottom,
          paddingTop: navbarHeight,
        }}
        onScroll={onScroll}
      >
        <SwitchTheme />
        <Button size={"small"} title={"Size sm"} onPress={onPress} />
        <Row gap={8}>
          <Button
            flex={1}
            flexBasis={0}
            type={"primaryFilled"}
            title={"Primary Filled"}
            onPress={onPress}
          />
          <Button
            flex={1}
            flexBasis={0}
            disabled={true}
            type={"primaryFilled"}
            title={"Disabled"}
            onPress={onPress}
          />
        </Row>
        <Row gap={8}>
          <Button
            flex={1}
            flexBasis={0}
            type={"primaryOutline"}
            title={"Primary Outline"}
            onPress={onPress}
          />
          <Button
            flex={1}
            flexBasis={0}
            disabled={true}
            type={"primaryOutline"}
            title={"Disabled"}
            onPress={onPress}
          />
        </Row>
        <Row gap={8}>
          <Button
            flex={1}
            flexBasis={0}
            type={"text"}
            title={"Text button"}
            onPress={onPress}
          />
          <Button
            flex={1}
            flexBasis={0}
            disabled={true}
            type={"text"}
            title={"Disabled"}
            onPress={onPress}
          />
        </Row>
        <Row gap={8}>
          <Button
            flex={1}
            flexBasis={0}
            type={"secondaryFilled"}
            title={"Secondary Filled"}
            onPress={onPress}
          />
          <Button
            flex={1}
            flexBasis={0}
            disabled={true}
            type={"secondaryFilled"}
            title={"Disabled"}
            onPress={onPress}
          />
        </Row>
        <Row gap={8}>
          <Button
            flex={1}
            flexBasis={0}
            type={"secondaryOutline"}
            title={"Secondary Outline"}
            onPress={onPress}
          />
          <Button
            flex={1}
            flexBasis={0}
            disabled={true}
            type={"secondaryOutline"}
            title={"Disabled"}
            onPress={onPress}
          />
        </Row>
        <Row gap={8}>
          <Button
            flexGrow={1}
            flexBasis={0}
            type={"dangerFilled"}
            title={"Danger Filled"}
            onPress={onPress}
          />
          <Button
            flexGrow={1}
            flexBasis={0}
            disabled={true}
            type={"dangerFilled"}
            title={"Disabled"}
            onPress={onPress}
          />
        </Row>
        <Row gap={8}>
          <Button
            flexGrow={1}
            flexBasis={0}
            type={"dangerOutline"}
            title={"Danger Outline"}
            onPress={onPress}
          />
          <Button
            flexGrow={1}
            flexBasis={0}
            disabled={true}
            type={"dangerOutline"}
            title={"Disabled"}
            onPress={onPress}
          />
        </Row>
      </Animated.ScrollView>
    </Col>
  );
});
