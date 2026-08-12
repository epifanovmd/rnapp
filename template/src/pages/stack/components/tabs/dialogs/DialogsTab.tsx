import { useScroll } from "@shared/lib/scroll";
import { useTransition } from "@shared/lib/transition";
import {
  Button,
  Dialog,
  IDialogProps,
  Row,
  Text,
  useDialogRef,
} from "@shared/ui";
import React, { FC, memo, useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface IDialogVariant {
  key: string;
  button: string;
  props: Partial<IDialogProps>;
  /** Длинный список — кейс, где поведение зависит от контента (прокрутка). */
  longContent?: boolean;
}

/** Варианты настроек диалога; контент во всех вариантах одинаковый. */
const DIALOG_VARIANTS: IDialogVariant[] = [
  { key: "default", button: "По умолчанию — slide по центру", props: {} },
  { key: "fade", button: "Анимация fade", props: { animationType: "fade" } },
  {
    key: "scale",
    button: "Анимация scale",
    props: { animationType: "scale" },
  },
  {
    key: "scale-slide",
    button: "Анимация scale + slide",
    props: { animationType: "scaleSlide" },
  },
  {
    key: "top",
    button: "Сверху (placement: top)",
    props: { placement: "top", animationDirection: "up" },
  },
  {
    key: "bottom",
    button: "Снизу (placement: bottom)",
    props: { placement: "bottom" },
  },
  {
    key: "swipe-right",
    button: "Появление и свайп вправо",
    props: { animationDirection: "right" },
  },
  {
    key: "no-backdrop",
    button: "Без закрытия по фону",
    props: { enableBackdropClose: false },
  },
  {
    key: "no-swipe",
    button: "Без свайп-закрытия",
    props: { enableSwipeClose: false },
  },
  {
    key: "backdrop",
    button: "Кастомный фон подложки",
    props: { backdropColor: "#001A5C", backdropOpacity: 0.85 },
  },
  { key: "haptic", button: "Haptic при открытии", props: { haptic: true } },
  {
    key: "scroll",
    button: "Прокручиваемый контент",
    props: {},
    longContent: true,
  },
];

/** Единый контент всех демо-диалогов. */
const DialogDemoContent: FC<{ long?: boolean }> = ({ long }) => (
  <>
    {Array.from({ length: long ? 60 : 3 }, (_, i) => (
      <Row key={i}>
        <Text>{`Строка ${i + 1}`}</Text>
      </Row>
    ))}
  </>
);

export const DialogsTab = memo(() => {
  const { bottom } = useSafeAreaInsets();
  const { navbar } = useTransition();
  const scroll = useScroll();

  const imperativeRef = useDialogRef();

  const [activeKey, setActiveKey] = useState<string | null>(null);
  // Вариант остаётся отрисованным на время анимации закрытия.
  const [renderedKey, setRenderedKey] = useState<string | null>(null);

  const close = useCallback(() => setActiveKey(null), []);
  const handleClosed = useCallback(() => setRenderedKey(null), []);

  const variant = DIALOG_VARIANTS.find(item => item.key === renderedKey);

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
        <Text textStyle={"Title_S1"}>{"Настройки диалога"}</Text>
        {DIALOG_VARIANTS.map(item => (
          <Button
            key={item.key}
            title={item.button}
            onPress={() => {
              setActiveKey(item.key);
              setRenderedKey(item.key);
            }}
          />
        ))}

        <Text textStyle={"Title_S1"}>{"Императивное управление"}</Text>
        <Button
          title={"Через ref — present/dismiss, без isVisible"}
          onPress={() => imperativeRef.current?.present()}
        />
      </Animated.ScrollView>

      <Dialog ref={imperativeRef} animationType={"scaleSlide"}>
        <Dialog.Header label={"Заголовок"} />
        <Dialog.Content>
          <DialogDemoContent />
        </Dialog.Content>
        <Dialog.Footer>
          <Dialog.Footer.PrimaryButton
            title={"Готово"}
            onPress={() => imperativeRef.current?.dismiss()}
          />
          <Dialog.Footer.SecondaryButton
            title={"Отмена"}
            onPress={() => imperativeRef.current?.dismiss()}
          />
        </Dialog.Footer>
      </Dialog>

      {variant && (
        <Dialog
          isVisible={activeKey === variant.key}
          onClose={close}
          onClosed={handleClosed}
          {...variant.props}
        >
          <Dialog.Header label={"Заголовок"} />
          <Dialog.Content>
            <DialogDemoContent long={variant.longContent} />
          </Dialog.Content>
          <Dialog.Footer>
            <Dialog.Footer.PrimaryButton title={"Готово"} onPress={close} />
            <Dialog.Footer.SecondaryButton title={"Отмена"} onPress={close} />
          </Dialog.Footer>
        </Dialog>
      )}
    </>
  );
});

const SS = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
});
