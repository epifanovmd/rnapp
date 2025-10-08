import {
  BottomSheet,
  BottomSheetFooter,
  BottomSheetHeader,
  Button,
  Col,
  Container,
  Content,
  Dialog,
  Row,
  ScrollView,
  Text,
  Title,
  Touchable,
  useBottomSheetAttach,
  useBottomSheetRef,
} from "@components";
import { Icon } from "@components/ui/icon";
import { StackProps } from "@core";
import { BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import React, { FC, memo, useCallback } from "react";

import { CustomFilter } from "./CustomFilter";

export const Modals: FC<StackProps> = memo(({ route }) => {
  const { open } = useBottomSheetAttach();
  const onAttach = useCallback(() => {
    open({
      onChange: value => {
        console.log("value", value);
      },
    });
  }, [open]);

  const filterRef = useBottomSheetRef();
  const modalRefScroll = useBottomSheetRef();
  const modalRefView = useBottomSheetRef();

  const [isVisible, setVisible] = React.useState(false);

  return (
    <Container>
      <Content>
        <ScrollView>
          <Title />

          <Button onPress={onAttach}>{"Attach"}</Button>
          <Button
            mt={8}
            title={"Open filter"}
            onPress={() => filterRef.current?.present()}
          />
          <Button
            mt={8}
            title={"View bottom sheet with snap point"}
            onPress={() => modalRefScroll.current?.present()}
          />
          <Button
            mt={8}
            title={"View bottom sheet"}
            onPress={() => {
              modalRefView.current?.present();
            }}
          />

          <Button
            mt={8}
            title={"View dialog"}
            onPress={() => {
              setVisible(true);
            }}
          />
        </ScrollView>
      </Content>

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

        <BottomSheetFooter
          onPrimary={() => {
            console.log("onAccept");
          }}
          onSecondary={() => {
            modalRefScroll.current?.dismiss();
          }}
        >
          <BottomSheetFooter.PrimaryButton title={"Готово"} />
          <BottomSheetFooter.SecondaryButton title={"Отмена"} />
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
        <BottomSheetFooter
          onPrimary={() => {
            console.log("onAccept");
          }}
          onSecondary={() => {
            modalRefView.current?.dismiss();
          }}
        >
          <BottomSheetFooter.PrimaryButton title={"Готово"} />
          <BottomSheetFooter.SecondaryButton title={"Отмена"} />
        </BottomSheetFooter>
      </BottomSheet>
    </Container>
  );
});
