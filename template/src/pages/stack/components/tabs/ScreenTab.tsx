import { useFocusedScroll } from "@shared/lib/scroll";
import {
  ListItem,
  Notice,
  ScreenScroll,
  Text,
  TextField,
  useNavbarInset,
} from "@shared/ui";
import React, { FC, memo, useCallback, useState } from "react";

const ROWS = Array.from({ length: 8 }, (_, index) => index + 1);

/** Демо ScreenScroll: pull-to-refresh (Promise) и поля ввода над клавиатурой. */
export const ScreenTab: FC = memo(() => {
  const navbarInset = useNavbarInset();
  const telemetry = useFocusedScroll();
  const [generation, setGeneration] = useState(0);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");

  const onRefresh = useCallback(
    () =>
      new Promise<void>(resolve =>
        setTimeout(() => {
          setGeneration(current => current + 1);
          resolve();
        }, 1200),
      ),
    [],
  );

  return (
    <ScreenScroll
      topInset={navbarInset}
      telemetry={telemetry}
      onRefresh={onRefresh}
    >
      <Text textStyle={"Body_M1"} color={"textSecondary"}>
        {"ScreenScroll · потяните вниз для обновления"}
      </Text>
      <Notice
        title={`Обновлений: ${generation}`}
        description={"onRefresh возвращает Promise — индикатор ждёт его"}
      />
      {ROWS.map(row => (
        <ListItem
          key={row}
          title={`Элемент ${row}`}
          subtitle={`Обновление ${generation}`}
        />
      ))}
      <TextField
        label={"Email"}
        value={email}
        onChangeText={setEmail}
        keyboardType={"email-address"}
      />
      <TextField
        label={"Комментарий"}
        value={comment}
        onChangeText={setComment}
        multiline
        hint={"Поле внизу экрана не перекрывается клавиатурой"}
      />
    </ScreenScroll>
  );
});
