import {
  Button,
  Container,
  Content,
  Header,
  Modal,
  Row,
  Text,
  Title,
  useModalRef,
  useTransition,
} from "@components";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { StackProps } from "@navigation";
import React, { FC, memo } from "react";
import Animated from "react-native-reanimated";

export const Modals: FC<StackProps> = memo(({ route }) => {
  const { onScroll, transitionY } = useTransition();

  const modalRef = useModalRef();

  return (
    <Container>
      <Content>
        <Header backAction={true} animatedValue={transitionY} />

        <Animated.ScrollView onScroll={onScroll}>
          <Text>{route.name}</Text>
          <Title />

          <Button
            mv={8}
            title="Open Bottom Sheet A"
            onPress={() => modalRef.current?.expand()}
          />

          <Button
            mv={8}
            title="Close Bottom Sheet A"
            onPress={() => modalRef.current?.close()}
          />
        </Animated.ScrollView>
      </Content>

      <Modal
        ref={modalRef}
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
    </Container>
  );
});
