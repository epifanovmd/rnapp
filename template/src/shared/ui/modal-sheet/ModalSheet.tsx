import React, {
  FC,
  PropsWithChildren,
  ReactNode,
  useEffect,
  useRef,
} from "react";

import { BottomSheet, useBottomSheetRef } from "../bottom-sheet";
import { TButtonVariant } from "../button";
import { Col } from "../flex-view";
import { Text } from "../text";

export interface IModalSheetAction {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: TButtonVariant;
}

export interface IModalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: ReactNode;
  /** Основное действие (отправка формы) — правая кнопка футера. */
  primaryAction?: IModalSheetAction;
  /** Подпись кнопки отмены; `null` — без неё. По умолчанию закрывает шторку. */
  cancelLabel?: string | null;
  /** Предел высоты по контенту; по умолчанию — почти весь экран. */
  maxHeight?: number;
}

/**
 * Управляемая шторка с API модалки: `open`/`onOpenChange`, заголовок,
 * описание и футер «Отмена / действие». Закрытие жестом или фоном
 * сообщает `onOpenChange(false)`.
 */
export const ModalSheet: FC<PropsWithChildren<IModalSheetProps>> = ({
  open,
  onOpenChange,
  title,
  description,
  primaryAction,
  cancelLabel = "Отмена",
  maxHeight,
  children,
}) => {
  const sheetRef = useBottomSheetRef();
  const presentedRef = useRef(false);

  // dismiss() ни разу не показанной шторки переводит её в «закрывается»,
  // и следующий present() её уже не открывает — закрываем только показанную.
  useEffect(() => {
    if (open) {
      presentedRef.current = true;
      sheetRef.current?.present();
    } else if (presentedRef.current) {
      presentedRef.current = false;
      sheetRef.current?.dismiss();
    }
  }, [open, sheetRef]);

  const hasFooter = !!primaryAction || cancelLabel !== null;

  return (
    <BottomSheet
      ref={sheetRef}
      keyboardBehavior={"interactive"}
      keyboardBlurBehavior={"restore"}
      android_keyboardInputMode={"adjustResize"}
      maxDynamicContentSize={maxHeight}
      onDismiss={() => {
        presentedRef.current = false;
        if (open) onOpenChange(false);
      }}
    >
      {!!title && <BottomSheet.Header label={title} />}
      <BottomSheet.Content>
        <Col gap={12} pb={8}>
          {typeof description === "string" ? (
            <Text textStyle={"Body_S2"} color={"textSecondary"}>
              {description}
            </Text>
          ) : (
            description
          )}
          {children}
        </Col>
      </BottomSheet.Content>
      {hasFooter && (
        <BottomSheet.Footer>
          {cancelLabel !== null && (
            <BottomSheet.Footer.SecondaryButton
              title={cancelLabel}
              onPress={() => onOpenChange(false)}
            />
          )}
          {!!primaryAction && (
            <BottomSheet.Footer.PrimaryButton
              title={primaryAction.title}
              loading={primaryAction.loading}
              disabled={primaryAction.disabled}
              variant={primaryAction.variant ?? "primary"}
              onPress={primaryAction.onPress}
            />
          )}
        </BottomSheet.Footer>
      )}
    </BottomSheet>
  );
};
