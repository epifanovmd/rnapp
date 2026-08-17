import { mergeRefs } from "@shared/lib/hooks/merge-refs";
import { BottomSheet, TBottomSheetProps, useBottomSheetRef } from "@shared/ui";
import React, { forwardRef } from "react";

import { SheetDemoContent } from "./SheetDemoContent";

export { SheetDemoContent } from "./SheetDemoContent";

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
