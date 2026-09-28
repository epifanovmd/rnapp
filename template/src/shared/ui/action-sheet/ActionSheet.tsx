import React, {
  ForwardedRef,
  forwardRef,
  ReactElement,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";

import { BottomSheet } from "../bottom-sheet";
import { Button } from "../button";
import { Col } from "../flex-view";
import type { IActionSheetProps } from "./action-sheet.types";
import { ActionSheetItem } from "./ActionSheetItem";

/**
 * Шторка выбора действия (источник файла, операция над объектом). Пункты —
 * данными: новое действие добавляется записью, без правки разметки.
 */
const ActionSheetImpl = <TKey extends string>(
  { title, items, onSelect, cancelLabel = "Отмена" }: IActionSheetProps<TKey>,
  ref: ForwardedRef<BottomSheet>,
) => {
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
    <BottomSheet ref={sheetRef} onDismiss={handleDismiss}>
      {!!title && <BottomSheet.Header label={title} />}
      <BottomSheet.Content>
        <Col pb={24} gap={12}>
          <Col bg={"surface"} radius={16} overflow={"hidden"}>
            {items.map(item => (
              <ActionSheetItem key={item.key} item={item} onPress={select} />
            ))}
          </Col>
          <Button
            size={"small"}
            appearance={"filled"}
            onPress={() => sheetRef.current?.dismiss()}
          >
            {cancelLabel}
          </Button>
        </Col>
      </BottomSheet.Content>
    </BottomSheet>
  );
};

export const ActionSheet = forwardRef(ActionSheetImpl) as <TKey extends string>(
  props: IActionSheetProps<TKey> & { ref?: ForwardedRef<BottomSheet> },
) => ReactElement;
