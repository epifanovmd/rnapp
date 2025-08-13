import {
  Button,
  Container,
  Content,
  Modal,
  ModalActions,
  ModalHeader,
  Row,
  Text,
  Title,
  useAttachModal,
  useModalRef,
  useTransition,
} from "@components";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { StackProps } from "@navigation";
import React, { FC, memo, useCallback } from "react";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export const Modals: FC<StackProps> = memo(({ route }) => {
  const { onScroll } = useTransition();
  const { open } = useAttachModal();
  const onAttach = useCallback(() => {
    open({
      onChange: value => {
        console.log("value", value);
      },
    });
  }, [open]);

  const modalRefScroll = useModalRef();
  const modalRefView = useModalRef();

  return (
    <Container>
      <Content>
        <Animated.ScrollView onScroll={onScroll}>
          <Title />

          <Button onPress={onAttach}>{"Attach"}</Button>
          <Button
            mt={8}
            title={"Scroll view modal"}
            onPress={() => modalRefScroll.current?.present()}
          />
          <Button
            mt={8}
            title={"View modal"}
            onPress={() => modalRefView.current?.present()}
          />
        </Animated.ScrollView>
      </Content>

      <Modal
        ref={modalRefScroll}
        snapPoints={[100, "30%", "80%"]}
        enableDynamicSizing={false}
      >
        <BottomSheetScrollView>
          {new Array(30).fill(0).map((_, i) => (
            <Row key={i}>
              <Text color={"red"}>{`Item B - ${i + 1}`}</Text>
            </Row>
          ))}
        </BottomSheetScrollView>
      </Modal>

      <Modal ref={modalRefView}>
        <BottomSheetView>
          <ModalHeader
            label={"Заголовок"}
            onClose={() => {
              modalRefView.current?.dismiss();
            }}
          />
          <Row ph={16}>
            <Text>{"Контент"}</Text>
          </Row>
          <ModalActions
            onAccept={() => {
              console.log("onAccept");
            }}
            onReject={() => {
              console.log("onReject");
              modalRefView.current?.dismiss();
            }}
          >
            <ModalActions.AcceptButton color={"red"} title={"Готово"} />
            <ModalActions.RejectButton color={"red"} title={"Отмена"} />
          </ModalActions>
          <SafeAreaView edges={["bottom"]} />
        </BottomSheetView>
      </Modal>
    </Container>
  );
});
