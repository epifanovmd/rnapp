import {
  BottomSheetView,
  Col,
  ImageViewing,
  Row,
  useModalRef,
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
  InputField,
  Modal,
  ModalActions,
  ModalHeader,
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
  const modalRef = useModalRef();
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
            onPress={() => modalRef.current?.present()}
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

          <InputField mt={8} bg={"yellow"}>
            <InputField.Input
              inputTextColor={"red"}
              placeholder={"Input"}
              placeholderTextColor={"red"}
            />
          </InputField>

          <InputField mt={8}>
            <InputField.Input
              inputTextColor={"red"}
              placeholder={"Input"}
              placeholderTextColor={"red"}
            />
            <InputField.Modal />
          </InputField>

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

      <Modal ref={modalRef}>
        <BottomSheetView>
          <ModalHeader
            label={"Заголовок"}
            onClose={() => {
              modalRef.current?.dismiss();
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
              modalRef.current?.dismiss();
            }}
          >
            <ModalActions.AcceptButton color={"red"} title={"Accept"} />
            <ModalActions.RejectButton color={"red"} title={"Reject"} />
          </ModalActions>
          {/* <SafeArea bottom />*/}
        </BottomSheetView>
      </Modal>
    </Container>
  );
});
