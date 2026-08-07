import { mergeRefs } from "@shared/lib/hooks/merge-refs";
import {
  BottomSheet,
  Row,
  TBottomSheetProps,
  Text,
  useBottomSheetRef,
} from "@shared/ui";
import React, { FC, forwardRef } from "react";

/** Единый контент всех демо-шторок: одинаковый список строк. */
export const SheetDemoContent: FC<{ count?: number }> = ({ count = 40 }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <Row key={i}>
        <Text>{`Строка ${i + 1}`}</Text>
      </Row>
    ))}
  </>
);

export interface IDemoSheetProps extends Partial<TBottomSheetProps> {
  label?: string;
  itemsCount?: number;
}

/** Шторка с одинаковым контентом; различаются только настройки листа. */
export const DemoSheet = forwardRef<BottomSheet, IDemoSheetProps>(
  ({ label = "Заголовок", itemsCount, ...sheetProps }, ref) => {
    const innerRef = useBottomSheetRef();

    return (
      <BottomSheet ref={mergeRefs([ref, innerRef])} {...sheetProps}>
        <BottomSheet.Header label={label} />
        <BottomSheet.Content>
          <SheetDemoContent count={itemsCount} />
        </BottomSheet.Content>
        <BottomSheet.Footer>
          <BottomSheet.Footer.PrimaryButton
            title={"Готово"}
            onPress={() => innerRef.current?.dismiss()}
          />
          <BottomSheet.Footer.SecondaryButton
            title={"Отмена"}
            onPress={() => innerRef.current?.dismiss()}
          />
        </BottomSheet.Footer>
      </BottomSheet>
    );
  },
);
