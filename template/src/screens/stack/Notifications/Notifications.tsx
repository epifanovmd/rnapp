import { Button, Container, Content, Header, Text } from "@components";
import { useNotification } from "@force-dev/react-mobile";
import React, { FC, memo } from "react";

import { StackProps } from "../../../navigation";

export const Notifications: FC<StackProps> = memo(({ route }) => {
  const { show, hide } = useNotification();

  return (
    <Container>
      <Header backAction={true} />
      <Content>
        <Text>{route.name}</Text>

        <Button
          mv={8}
          title={"Show notify"}
          onPress={() => show("Simple message")}
        />

        <Button mv={8} title={"hideMessage"} onPress={() => hide()} />
      </Content>
    </Container>
  );
});
