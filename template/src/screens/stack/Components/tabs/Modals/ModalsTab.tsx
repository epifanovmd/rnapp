import {
  BottomSheet,
  BottomSheetFooter,
  Button,
  Col,
  Dialog,
  Row,
  ScrollView,
  Text,
  Touchable,
  useBottomSheetRef,
} from "@components";
import { Icon } from "@components/ui/icon";
import { TabProps, useTransition } from "@core";
import React, { FC, memo } from "react";

import { CustomFilter } from "./CustomFilter";

export const ModalsTab: FC<TabProps> = memo(({ route }) => {
  const { navbarHeight } = useTransition();

  const filterRef = useBottomSheetRef();
  const modalRefScroll = useBottomSheetRef();
  const modalRefView = useBottomSheetRef();

  const [isVisible, setVisible] = React.useState(false);

  return (
    <Col ph={16} gap={8} pt={navbarHeight}>
      <Button
        title={"Open filter"}
        onPress={() => filterRef.current?.present()}
      />
      <Button
        title={"View bottom sheet with snap point"}
        onPress={() => modalRefScroll.current?.present()}
      />
      <Button
        title={"View bottom sheet"}
        onPress={() => {
          modalRefView.current?.present();
        }}
      />

      <Button
        title={"View dialog"}
        onPress={() => {
          setVisible(true);
        }}
      />

      <CustomFilter ref={filterRef} />

      <Dialog
        isVisible={isVisible}
        onClose={() => setVisible(false)}
        enableBackdropClose={false}
        enableSwipeClose={true}
      >
        <Row
          alignItems={"center"}
          gap={8}
          justifyContent={"space-between"}
          pb={16}
        >
          <Text textStyle={"Title_L"}>{"Заголовок"}</Text>
          <Touchable onPress={() => setVisible(false)}>
            <Icon name={"closeCircle"} />
          </Touchable>
        </Row>
        <ScrollView>
          {new Array(20).fill(0).map((_, i) => (
            <Row key={i}>
              <Text>{`Item B - ${i + 1}`}</Text>
            </Row>
          ))}
        </ScrollView>
        <Button
          mt={8}
          title={"Close modal"}
          onPress={() => {
            setVisible(false);
          }}
        />
      </Dialog>

      <BottomSheet
        ref={modalRefScroll}
        snapPoints={[200, "80%"]}
        enableDynamicSizing={false}
        maxDynamicContentSize={300}
      >
        <BottomSheet.Header
          label={"Заголовок"}
          onClose={() => {
            modalRefScroll.current?.dismiss();
          }}
        />
        <BottomSheet.Content>
          {new Array(90).fill(0).map((_, i) => (
            <Row key={i}>
              <Text>{`Item B - ${i + 1}`}</Text>
            </Row>
          ))}
        </BottomSheet.Content>

        <BottomSheetFooter>
          <BottomSheetFooter.PrimaryButton title={"Готово"} />
          <BottomSheetFooter.SecondaryButton
            title={"Отмена"}
            onPress={() => {
              modalRefScroll.current?.dismiss();
            }}
          />
        </BottomSheetFooter>
      </BottomSheet>

      <BottomSheet ref={modalRefView} maxDynamicContentSize={300}>
        <BottomSheet.Header
          label={"Заголовок"}
          onClose={() => {
            modalRefView.current?.dismiss();
          }}
        />
        <BottomSheet.Content>
          <Text>{"Контент"}</Text>
          {new Array(50).fill(0).map((_, i) => (
            <Row key={i}>
              <Text>{`Item B - ${i + 1}`}</Text>
            </Row>
          ))}
        </BottomSheet.Content>
        <BottomSheetFooter>
          <BottomSheetFooter.PrimaryButton title={"Готово"} />
          <BottomSheetFooter.SecondaryButton
            title={"Отмена"}
            onPress={() => {
              modalRefView.current?.dismiss();
            }}
          />
        </BottomSheetFooter>
      </BottomSheet>
    </Col>
  );
});
