import { TabProps } from "@shared/lib/navigation";
import { useScroll } from "@shared/lib/scroll";
import { useTransition } from "@shared/lib/transition";
import { BottomSheet, Button, Text } from "@shared/ui";
import React, { memo, useRef } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CustomFilter } from "./CustomFilter";
import { DemoSheet, IDemoSheetProps } from "./DemoSheet";
import { SheetKeyboardDemo } from "./SheetKeyboardDemo";
import { SheetStackDemo } from "./SheetStackDemo";

interface ISheetVariant {
  key: string;
  button: string;
  props: IDemoSheetProps;
}

/** Варианты настроек листа; контент во всех шторках одинаковый. */
const SHEET_VARIANTS: ISheetVariant[] = [
  {
    key: "dynamic",
    button: "Dynamic sizing — высота по контенту",
    props: { maxDynamicContentSize: 500 },
  },
  {
    key: "snap",
    button: "Snap points [300, 60%]",
    props: { snapPoints: [300, "60%"], enableDynamicSizing: false },
  },
  {
    key: "no-pan",
    button: "Без свайпа вниз (enablePanDownToClose: false)",
    props: { enablePanDownToClose: false, maxDynamicContentSize: 450 },
  },
  {
    key: "haptic",
    button: "Haptic при открытии",
    props: { haptic: true, maxDynamicContentSize: 450 },
  },
  {
    key: "detached",
    button: "Detached — плавающая карточка",
    props: {
      detached: true,
      bottomInset: 24,
      maxDynamicContentSize: 420,
      style: { marginHorizontal: 16 },
    },
  },
];

export const ModalsTab = memo<TabProps>(() => {
  const { bottom } = useSafeAreaInsets();
  const { navbar } = useTransition();
  const scroll = useScroll();

  const sheetRefs = useRef<Record<string, BottomSheet | null>>({});
  const stackRef = useRef<BottomSheet>(null);
  const keyboardRef = useRef<BottomSheet>(null);
  const filterRef = useRef<BottomSheet>(null);

  return (
    <>
      <Animated.ScrollView
        contentContainerStyle={[
          SS.container,
          { paddingBottom: bottom + 16, paddingTop: navbar.height },
        ]}
        onScroll={scroll?.scrollHandler}
        scrollEventThrottle={16}
      >
        <Text textStyle={"Title_S1"}>{"Настройки листа"}</Text>
        {SHEET_VARIANTS.map(variant => (
          <Button
            key={variant.key}
            title={variant.button}
            onPress={() => sheetRefs.current[variant.key]?.present()}
          />
        ))}

        <Text textStyle={"Title_S1"}>{"Поведение"}</Text>
        <Button
          title={"Стек модалок (stackBehavior)"}
          onPress={() => stackRef.current?.present()}
        />
        <Button
          title={"Клавиатура (keyboardBehavior)"}
          onPress={() => keyboardRef.current?.present()}
        />

        <Text textStyle={"Title_S1"}>{"Практический пример"}</Text>
        <Button
          title={"Фильтр с чипами"}
          onPress={() => filterRef.current?.present()}
        />
      </Animated.ScrollView>

      {SHEET_VARIANTS.map(variant => (
        <DemoSheet
          key={variant.key}
          ref={sheet => {
            sheetRefs.current[variant.key] = sheet;
          }}
          {...variant.props}
        />
      ))}
      <SheetStackDemo ref={stackRef} />
      <SheetKeyboardDemo ref={keyboardRef} />
      <CustomFilter ref={filterRef} />
    </>
  );
});

const SS = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
});
