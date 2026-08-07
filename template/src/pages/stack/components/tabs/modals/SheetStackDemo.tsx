import { BottomSheet, Button, Col, Text, useBottomSheetRef } from "@shared/ui";
import React, { forwardRef } from "react";

import { DemoSheet } from "./DemoSheet";

/**
 * Демо stackBehavior: контент здесь намеренно другой — кнопки открывают
 * вторую шторку поверх текущей, чтобы показать поведение стека модалок.
 */
export const SheetStackDemo = forwardRef<BottomSheet>((_props, ref) => {
  const replaceRef = useBottomSheetRef();
  const pushRef = useBottomSheetRef();
  const switchRef = useBottomSheetRef();

  return (
    <>
      <BottomSheet ref={ref}>
        <BottomSheet.Header label={"Стек модалок"} />
        <BottomSheet.Content>
          <Col gap={8} pb={8}>
            <Text textStyle={"Caption_M3"}>
              {
                "Откройте вторую шторку поверх текущей и закройте её — поведение первой зависит от stackBehavior."
              }
            </Text>
            <Button
              title={"replace — закрыть текущую (по умолчанию)"}
              onPress={() => replaceRef.current?.present()}
            />
            <Button
              title={"push — оставить текущую позади"}
              onPress={() => pushRef.current?.present()}
            />
            <Button
              title={"switch — свернуть и восстановить потом"}
              onPress={() => switchRef.current?.present()}
            />
          </Col>
        </BottomSheet.Content>
      </BottomSheet>

      <DemoSheet
        ref={replaceRef}
        label={"stackBehavior: replace"}
        stackBehavior={"replace"}
        itemsCount={10}
      />
      <DemoSheet
        ref={pushRef}
        label={"stackBehavior: push"}
        stackBehavior={"push"}
        itemsCount={10}
      />
      <DemoSheet
        ref={switchRef}
        label={"stackBehavior: switch"}
        stackBehavior={"switch"}
        itemsCount={10}
      />
    </>
  );
});
