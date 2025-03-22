import { useNotification } from "@force-dev/react-mobile";
import React, { FC, memo } from "react";
import { Alert } from "react-native";

import { Button, Container, Content, Header, Text } from "~@components";

import { StackProps } from "../../../navigation";

export const Notifications: FC<StackProps> = memo(({ route, navigation }) => {
  const { show, hide } = useNotification();

  React.useEffect(
    () =>
      navigation.addListener("beforeRemove", e => {
        e.preventDefault();

        Alert.alert(
          "Отменить изменения?",
          "У вас есть несохраненные изменения. Вы уверены, что хотите их отменить и выйти с экрана?",
          [
            {
              text: "Остаться",
              style: "cancel",
              onPress: () => {
                // Ничего не делать
              },
            },
            {
              text: "Выйти без сохранения",
              style: "destructive",
              onPress: () => navigation.dispatch(e.data.action),
            },
          ],
        );
      }),
    [navigation],
  );

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
