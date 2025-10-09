import { Button, Col, ScrollView } from "@components";
import { TabProps } from "@core";
import { memo, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const ButtonsTab = memo<TabProps>(() => {
  const { bottom } = useSafeAreaInsets();

  const onPress = useCallback(() => {
    console.log("Press button");
  }, []);

  return (
    <Col ph={16} gap={8}>
      <ScrollView contentContainerStyle={{ gap: 8, paddingBottom: bottom }}>
        <Button size={"small"} title={"Size sm"} onPress={onPress} />
        <Button title={"Size normal"} onPress={onPress} />
        <Button type={"text"} title={"Text button"} onPress={onPress} />
        <Button
          type={"secondaryFilled"}
          title={"Secondary Filled"}
          onPress={onPress}
        />
        <Button
          type={"secondaryOutline"}
          title={"Secondary Outline"}
          onPress={onPress}
        />
        <Button
          type={"primaryOutline"}
          title={"Primary Outline"}
          onPress={onPress}
        />
        <Button
          type={"primaryFilled"}
          title={"Primary Filled"}
          onPress={onPress}
        />
        <Button
          type={"dangerFilled"}
          title={"Danger Filled"}
          onPress={onPress}
        />
        <Button
          type={"dangerOutline"}
          title={"Danger Outline"}
          onPress={onPress}
        />

        <Button
          disabled={true}
          size={"small"}
          title={"Size sm (disabled)"}
          onPress={onPress}
        />
        <Button
          disabled={true}
          title={"Size normal (disabled)"}
          onPress={onPress}
        />
        <Button
          disabled={true}
          type={"text"}
          title={"Text button (disabled)"}
          onPress={onPress}
        />
        <Button
          disabled={true}
          type={"secondaryFilled"}
          title={"Secondary filled (disabled)"}
          onPress={onPress}
        />
        <Button
          disabled={true}
          type={"secondaryOutline"}
          title={"Secondary Outline (disabled)"}
          onPress={onPress}
        />
        <Button
          disabled={true}
          type={"primaryOutline"}
          title={"Primary Outline (disabled)"}
          onPress={onPress}
        />
        <Button
          disabled={true}
          type={"primaryFilled"}
          title={"Primary Filled (disabled)"}
          onPress={onPress}
        />
        <Button
          disabled={true}
          type={"dangerFilled"}
          title={"Danger Filled (disabled)"}
          onPress={onPress}
        />
        <Button
          disabled={true}
          type={"dangerOutline"}
          title={"Danger Outline (disabled)"}
          onPress={onPress}
        />
      </ScrollView>
    </Col>
  );
});
