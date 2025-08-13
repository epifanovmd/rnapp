import { Col, Container, Content } from "@components";
import { StackProps } from "@core";
import LottieView from "lottie-react-native";
import React, { FC, memo } from "react";

export const Lottie: FC<StackProps> = memo(() => {
  return (
    <Container>
      <Content>
        <Col justifyContent={"center"} flex={1} row>
          <LottieView
            source={require("./assets/animation.json")}
            autoPlay
            loop
            speed={0.5}
            style={{ height: 300, width: 300 }}
          />
        </Col>
      </Content>
    </Container>
  );
});
