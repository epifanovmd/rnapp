import {
  Col,
  ImageViewing,
  ModalHeader,
  Row,
  useModal,
} from "@force-dev/react-mobile";
import React, { FC, memo, useCallback, useEffect, useState } from "react";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";

import {
  AnimatedRefreshing,
  Button,
  Checkbox,
  Container,
  Content,
  Header,
  Image,
  Modal,
  ModalActions,
  Text,
  Title,
  Touchable,
  useAnimationHeader,
  useAttachModal,
} from "~@components";

import { StackProps } from "../../../navigation";

export const Components: FC<StackProps> = memo(({ route }) => {
  const value = useSharedValue(0);
  const { open } = useAttachModal();
  const { ref: modalRef } = useModal();
  const { onScroll, animatedValue } = useAnimationHeader();

  useEffect(() => {
    value.value = withTiming(100, { duration: 1000 }, () => {
      value.value = withTiming(30, { duration: 1000 });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAttach = useCallback(() => {
    open({
      onChange: value => {
        console.log("value", value);
      },
    });
  }, [open]);

  const [uri, setUri] = useState<string | null>(null);

  return (
    <Container>
      <Content>
        <Header backAction={true} animatedValue={animatedValue} />

        <Animated.ScrollView onScroll={onScroll}>
          <Text>{route.name}</Text>
          <Title />

          <AnimatedRefreshing percentage={value} />

          <Button onPress={onAttach}>{"Attach button"}</Button>

          <Button
            mv={8}
            title={"show modal"}
            onPress={() => modalRef.current?.open()}
          />

          <Row>
            <Checkbox
              onPress={v => console.log("checkbox", v)}
              row={true}
              alignItems={"center"}
            >
              <Text ml={8}>{"press row or checkbox"}</Text>
            </Checkbox>
          </Row>

          <Row mt={8} alignItems={"center"}>
            <Checkbox
              onPress={v => console.log("checkbox", v)}
              row={true}
              alignItems={"center"}
            />
            <Text ml={8}>{"only press checkbox"}</Text>
          </Row>

          <Col mt={8} height={100} width={100}>
            <ImageViewing
              imageIndex={0}
              onRequestClose={() => {
                setUri(null);
              }}
              visible={!!uri}
              images={uri ? [{ uri }] : []}
            />
            <Touchable
              ctx={
                "https://random-image-pepebigotes.vercel.app/api/random-image"
              }
              onPress={setUri}
            >
              <Image
                height={"100%"}
                width={"100%"}
                url={
                  "https://random-image-pepebigotes.vercel.app/api/random-image"
                }
              />
            </Touchable>
          </Col>
        </Animated.ScrollView>
      </Content>

      <Modal
        ref={modalRef}
        // adjustToContentHeight={true}
        handlePosition={"inside"}
        handleStyle={{ backgroundColor: "red" }}
        closeSnapPointStraightEnabled={false}
        snapPoint={200}
        withHandle={false}
        modalHeight={400}
        // alwaysOpen={100}
      >
        <ModalHeader onClose={modalRef.current?.close}>
          <Text>Заголовок</Text>
        </ModalHeader>
        <Col ph={16}>
          <Text>{"Контент"}</Text>
        </Col>
        <ModalActions
          onAccept={() => {
            console.log("onAccept");
          }}
          onReject={() => {
            console.log("onReject");
          }}
        >
          <ModalActions.AcceptButton color={"red"} title={"Accept"} />
          <ModalActions.RejectButton color={"red"} title={"Reject"} />
        </ModalActions>
      </Modal>
    </Container>
  );
});
