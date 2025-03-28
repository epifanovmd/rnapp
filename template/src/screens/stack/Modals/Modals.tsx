import { Col, Row, useModalRef } from "@force-dev/react-mobile";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { FC, memo } from "react";
import Animated from "react-native-reanimated";

import {
  Button,
  Container,
  Content,
  Header,
  Modal,
  Text,
  Title,
  Touchable,
  useAnimationHeader,
} from "~@components";

import { StackProps } from "../../../navigation";

export const Modals: FC<StackProps> = memo(({ route }) => {
  const { onScroll, animatedValue } = useAnimationHeader();

  const modalRef = useModalRef();

  return (
    <Container>
      <Content>
        <Header backAction={true} animatedValue={animatedValue} />

        <Animated.ScrollView onScroll={onScroll}>
          <Text>{route.name}</Text>
          <Title />

          <Button
            mv={8}
            title="Open Bottom Sheet A"
            onPress={() => modalRef.current?.present()}
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
