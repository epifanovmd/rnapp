import { Button, Container, Content, Header, Text } from "@components";
import { StackProps } from "@navigation";
import notifee from "@notifee/react-native";
import React, { FC, memo } from "react";

import { useNotification } from "../../../notification";

export const Notifications: FC<StackProps> = memo(({ route, navigation }) => {
  const { show, hide } = useNotification();

  const onDisplayNotification = async () => {
    const channelId = await notifee.createChannel({
      id: "default",
      name: "Default Channel",
      vibration: true, // Включение вибрации
    });

    await notifee.displayNotification({
      title: "Уведомление",
      body: "Нажмите, чтобы открыть ссылку",
      data: {
        url: "rnapp://Modals",
      },
      ios: {
        sound: "default",
        critical: true,
      },
      android: {
        channelId,
        vibrationPattern: [300, 500],
      },
    });
  };

  // React.useEffect(
  //   () =>
  //     navigation.addListener("beforeRemove", e => {
  //       e.preventDefault();
  //
  //       Alert.alert(
  //         "Отменить изменения?",
  //         "У вас есть несохраненные изменения. Вы уверены, что хотите их отменить и выйти с экрана?",
  //         [
  //           {
  //             text: "Остаться",
  //             style: "cancel",
  //             onPress: () => {
  //               // Ничего не делать
  //             },
  //           },
  //           {
  //             text: "Выйти без сохранения",
  //             style: "destructive",
  //             onPress: () => navigation.dispatch(e.data.action),
  //           },
  //         ],
  //       );
  //     }),
  //   [navigation],
  // );

  return (
    <Container>
      <Header backAction={true} />
      <Content>
        <Text>{route.name}</Text>

        <Button mv={8} title={"normal"} onPress={() => show("normal")} />

        <Button
          mv={8}
          title={"success"}
          onPress={() => show("success", { type: "success" })}
        />

        <Button
          mv={8}
          title={"warning"}
          onPress={() => show("warning", { type: "warning" })}
        />

        <Button
          mv={8}
          title={"danger"}
          onPress={() => show("danger", { type: "danger" })}
        />

        <Button
          mv={8}
          title={"custom_toast"}
          onPress={() =>
            show("custom_toast", {
              type: "custom_toast",
              data: { title: "Title" },
            })
          }
        />

        <Button mv={8} title={"hideMessage"} onPress={() => hide()} />

        <Button
          mv={8}
          title={"Push notification"}
          onPress={onDisplayNotification}
        />
      </Content>
    </Container>
  );
});
