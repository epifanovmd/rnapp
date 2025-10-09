import { Button, Col } from "@components";
import { TabProps, useNotification } from "@core";
import notifee from "@notifee/react-native";
import React, { FC, memo } from "react";

export const NotificationsTab: FC<TabProps> = memo(({ route, navigation }) => {
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
    <Col ph={16} gap={8}>
      <Button title={"normal"} onPress={() => show("normal")} />

      <Button
        title={"success"}
        onPress={() => show("success", { type: "success" })}
      />

      <Button
        title={"warning"}
        onPress={() => show("warning", { type: "warning" })}
      />

      <Button
        title={"danger"}
        onPress={() => show("danger", { type: "danger" })}
      />

      <Button
        title={"custom_toast"}
        onPress={() =>
          show("custom_toast", {
            type: "custom_toast",
            data: { title: "Title" },
          })
        }
      />

      <Button title={"hideMessage"} onPress={() => hide()} />

      <Button title={"Push notification"} onPress={onDisplayNotification} />
    </Col>
  );
});
