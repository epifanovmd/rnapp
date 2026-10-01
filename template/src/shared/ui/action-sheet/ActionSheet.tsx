import { useTheme } from "@shared/lib/theme";
import React, {
  ForwardedRef,
  forwardRef,
  Fragment,
  ReactElement,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { StyleSheet, View } from "react-native";

import { BottomSheet } from "../bottom-sheet";
import { Col } from "../flex-view";
import { Text } from "../text";
import { Touchable } from "../touchable";
import type { IActionSheetProps } from "./action-sheet.types";
import { ActionSheetItem } from "./ActionSheetItem";

/**
 * Шторка выбора действия (источник файла, операция над объектом), по образцу
 * системного action sheet: заголовок по центру, действия одной группой с
 * разделителями, «Отмена» — отдельной плашкой. Пункты — данными: новое
 * действие добавляется записью, без правки разметки.
 */
const ActionSheetImpl = <TKey extends string>(
  {
    title,
    items,
    onSelect,
    cancelLabel = "Отмена",
    nested,
  }: IActionSheetProps<TKey>,
  ref: ForwardedRef<BottomSheet>,
) => {
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheet>(null);
  const pending = useRef<TKey | null>(null);

  useImperativeHandle(ref, () => sheetRef.current as BottomSheet, []);

  const select = useCallback((key: string) => {
    pending.current = key as TKey;
    sheetRef.current?.dismiss();
  }, []);

  const handleDismiss = useCallback(() => {
    const key = pending.current;

    pending.current = null;
    if (key !== null) onSelect(key);
  }, [onSelect]);

  return (
    <BottomSheet ref={sheetRef} nested={nested} onDismiss={handleDismiss}>
      <BottomSheet.Content>
        <Col gap={10} pb={8}>
          {!!title && (
            <Text
              textStyle={"Caption_M2"}
              color={"textSecondary"}
              textAlign={"center"}
              numberOfLines={2}
              pb={2}
            >
              {title}
            </Text>
          )}
          <Col bg={"onSurface"} radius={16} overflow={"hidden"}>
            {items.map((item, index) => (
              <Fragment key={item.key}>
                {index > 0 && (
                  <View
                    style={[
                      styles.separator,
                      { backgroundColor: colors.border },
                      // Разделитель — от подписи, как в системных списках.
                      !!item.icon && styles.separatorInset,
                    ]}
                  />
                )}
                <ActionSheetItem item={item} onPress={select} />
              </Fragment>
            ))}
          </Col>
          <Touchable
            bg={"onSurface"}
            radius={16}
            minHeight={52}
            centerContent
            onPress={() => sheetRef.current?.dismiss()}
            accessibilityRole={"button"}
          >
            <Text textStyle={"Title_S2"}>{cancelLabel}</Text>
          </Touchable>
        </Col>
      </BottomSheet.Content>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  separatorInset: {
    marginLeft: 50,
  },
});

export const ActionSheet = forwardRef(ActionSheetImpl) as <TKey extends string>(
  props: IActionSheetProps<TKey> & { ref?: ForwardedRef<BottomSheet> },
) => ReactElement;
