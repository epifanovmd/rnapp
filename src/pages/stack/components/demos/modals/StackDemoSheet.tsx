import { BottomSheet, TBottomSheetProps, Text } from "@shared/ui";
import React, { forwardRef } from "react";

export interface IStackDemoSheetProps extends Partial<TBottomSheetProps> {
  label: string;
  description: string;
  primaryTitle: string;
  onPrimary: () => void;
  onBack: () => void;
}

/** Шаг демо-стека шторок: контент + кнопки перехода вперёд/назад. */
export const StackDemoSheet = forwardRef<BottomSheet, IStackDemoSheetProps>(
  (
    { label, description, primaryTitle, onPrimary, onBack, ...sheetProps },
    ref,
  ) => (
    <BottomSheet ref={ref} maxDynamicContentSize={400} {...sheetProps}>
      <BottomSheet.Header label={label} />
      <BottomSheet.Content>
        <Text>{description}</Text>
      </BottomSheet.Content>
      <BottomSheet.Footer>
        <BottomSheet.Footer.SecondaryButton title={"Назад"} onPress={onBack} />
        <BottomSheet.Footer.PrimaryButton
          title={primaryTitle}
          onPress={onPrimary}
        />
      </BottomSheet.Footer>
    </BottomSheet>
  ),
);
