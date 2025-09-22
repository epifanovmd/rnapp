import {
  BottomSheet,
  BottomSheetActions,
  BottomSheetHeader,
  Button,
  Container,
  Content,
  Dialog,
  Row,
  ScrollView,
  Text,
  Title,
  useAttachModal,
  useBottomSheetRef,
} from "@components";
import { StackProps } from "@core";
import { BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import React, { FC, memo, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export const Modals: FC<StackProps> = memo(({ route }) => {
  const { open } = useAttachModal();
  const onAttach = useCallback(() => {
    open({
      onChange: value => {
        console.log("value", value);
      },
    });
  }, [open]);

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
            title={"Scroll view modal"}
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

      <Dialog
        isVisible={isVisible}
        onClose={() => setVisible(false)}
        animationDuration={250}
        animationType={"slide"}
        swipeDirection={"up"}
        style={{ borderRadius: 16, flexShrink: 1, padding: 16 }}
        enableBackdropClose={false}
        enableSwipeClose={false}
      >
        <ScrollView>
          {new Array(10).fill(0).map((_, i) => (
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
        snapPoints={[200, "50%", "80%"]}
        enableDynamicSizing={false}
        maxDynamicContentSize={300}
      >
        <BottomSheetScrollView style={{ padding: 16, marginBottom: 30 }}>
          {new Array(30).fill(0).map((_, i) => (
            <Row key={i}>
              <Text>{`Item B - ${i + 1}`}</Text>
            </Row>
          ))}
        </BottomSheetScrollView>
      </BottomSheet>

      <BottomSheet ref={modalRefView}>
        <BottomSheetView>
          <BottomSheetHeader
            label={"Заголовок"}
            onClose={() => {
              modalRefView.current?.dismiss();
            }}
          />
          <Row ph={16}>
            <Text>{"Контент"}</Text>
          </Row>
          <BottomSheetActions
            onAccept={() => {
              console.log("onAccept");
            }}
            onReject={() => {
              console.log("onReject");
              modalRefView.current?.dismiss();
            }}
          >
            <BottomSheetActions.AcceptButton color={"red"} title={"Готово"} />
            <BottomSheetActions.RejectButton color={"red"} title={"Отмена"} />
          </BottomSheetActions>
          <SafeAreaView edges={["bottom"]} />
        </BottomSheetView>
      </BottomSheet>
    </Container>
  );
});
