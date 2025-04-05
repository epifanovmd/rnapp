import {
  Button,
  Container,
  Content,
  Header,
  SwitchTheme,
  Text,
} from "@components";
import { Col, Row } from "@force-dev/react-mobile";
import { useSessionDataStore } from "@store";
import React, { FC, memo } from "react";

import { AppScreenProps } from "../../../navigation";
import { Lottie } from "../../stack/Lottie";
import { Biometric } from "./Biometric";

interface IProps extends AppScreenProps {}

export const Playground: FC<IProps> = memo(({ navigation, route }) => {
  const { clear } = useSessionDataStore();

  return (
    <Container>
      <Header />

      <Content>
        <Row mb={32}>
          <Text>{route.name}</Text>
          <SwitchTheme marginLeft={"auto"} />
        </Row>
        <Button
          mt={8}
          title={"Notifications"}
          onPress={() => navigation.navigate("Notifications")}
        />

        <Button
          mt={8}
          title={"Gallery"}
          onPress={() => navigation.navigate("Gallery")}
        />

        <Button
          mt={8}
          title={"Lottie"}
          onPress={() => navigation.navigate("Lottie")}
        />

        <Button
          mt={8}
          title={"Components"}
          onPress={() => navigation.navigate("Components")}
        />

        <Button
          mt={8}
          title={"Modals"}
          onPress={() => navigation.navigate("Modals")}
        />

        <Button
          mt={8}
          title={"Pickers"}
          onPress={() => navigation.navigate("Pickers")}
        />

        <Button
          mt={8}
          title={"ChatScreen"}
          onPress={() => navigation.navigate("ChatScreen")}
        />

        <Col mt={8}>
          <Biometric />
        </Col>

        <Button mt={8} title={"Выход"} onPress={() => clear()} />
      </Content>
    </Container>
  );
});
