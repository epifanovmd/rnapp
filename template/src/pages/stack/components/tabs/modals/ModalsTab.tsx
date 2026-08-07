import { TabProps } from "@shared/lib/navigation";
import { useScroll } from "@shared/lib/scroll";
import { useTransition } from "@shared/lib/transition";
import { BottomSheet, Button, Text, useBottomSheetStack } from "@shared/ui";
import React, { memo, useRef } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CustomFilter } from "./CustomFilter";
import { DemoSheet, IDemoSheetProps } from "./DemoSheet";
import { SheetKeyboardDemo } from "./SheetKeyboardDemo";
import { StackDemoSheet } from "./StackDemoSheet";

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
  const keyboardRef = useRef<BottomSheet>(null);
  const filterRef = useRef<BottomSheet>(null);

  const stack = useBottomSheetStack({ first: {}, second: {}, third: {} });

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
          title={"Клавиатура (keyboardBehavior)"}
          onPress={() => keyboardRef.current?.present()}
        />

        <Text textStyle={"Title_S1"}>{"Стек шторок"}</Text>
        <Button
          title={"Открыть стек (present / back)"}
          onPress={() => stack.present("first")}
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
      <SheetKeyboardDemo ref={keyboardRef} />
      <CustomFilter ref={filterRef} />

      <StackDemoSheet
        {...stack.sheets.first}
        label={"Шаг 1 из 3"}
        description={
          "Первый лист стека. «Дальше» откроет следующий лист поверх текущего."
        }
        primaryTitle={"Дальше"}
        onPrimary={() => stack.present("second")}
        onBack={stack.back}
      />
      <StackDemoSheet
        {...stack.sheets.second}
        label={"Шаг 2 из 3"}
        description={
          "Второй лист. «Назад» вернёт к первому, свайп вниз закроет весь стек."
        }
        primaryTitle={"Дальше"}
        onPrimary={() => stack.present("third")}
        onBack={stack.back}
      />
      <StackDemoSheet
        {...stack.sheets.third}
        label={"Шаг 3 из 3"}
        description={"Последний лист. «Готово» закрывает весь стек."}
        primaryTitle={"Готово"}
        onPrimary={stack.dismiss}
        onBack={stack.back}
      />
    </>
  );
});

const SS = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
});
