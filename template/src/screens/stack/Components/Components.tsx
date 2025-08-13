import {
  AnimatedRefreshing,
  Button,
  Checkbox,
  Col,
  Container,
  Content,
  Field,
  Image,
  ImageViewing,
  Row,
  Text,
  Title,
  Touchable,
} from "@components";
import { TextField } from "@components/ui/input/TextField";
import { StackProps, useTransition } from "@core";
import React, { FC, memo, useEffect, useState } from "react";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";

export const Components: FC<StackProps> = memo(({ route }) => {
  const value = useSharedValue(0);
  const { onScroll } = useTransition();

  useEffect(() => {
    value.value = withTiming(100, { duration: 1000 }, () => {
      value.value = withTiming(30, { duration: 1000 });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [uri, setUri] = useState<string | null>(null);
  const [inputValue, setValue] = useState("");

  return (
    <Container>
      <Content>
        <Animated.ScrollView onScroll={onScroll}>
          <Text>{route.name}</Text>
          <Title />

          <AnimatedRefreshing percentage={value} />

          <Button>{"Button"}</Button>

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

          <Col style={{ gap: 8 }}>
            <TextField
              style={{ marginTop: 16 }}
              label={"Text field with error"}
              value={inputValue}
              error={!inputValue && "Value is required"}
              clearable={true}
              hint={"$"}
              hintPosition={"left"}
              keyboardType={"numeric"}
              onChangeText={setValue}
            />

            <Field label={"Test label"} error={"1"} description={"Desc"}>
              <Text>{"Test simple text"}</Text>
            </Field>
          </Col>

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
    </Container>
  );
});
