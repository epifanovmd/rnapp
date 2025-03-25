import { Col } from "@force-dev/react-mobile";
import LottieView from "lottie-react-native";
import React, { FC, memo } from "react";

import { Container, Content, Header } from "~@components";

import { StackProps } from "../../../navigation";

export const Lottie: FC<StackProps> = memo(() => {
  return (
    <Container>
      <Content>
        <Header backAction={true} />

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
