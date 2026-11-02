import {
  AnchorList,
  IAnchorListRenderItemProps,
} from "@epifanovmd/anchor-list";
import { useKeyboardAwareAnchorList } from "@shared/lib/keyboard-aware";
import { useNotifications } from "@shared/lib/notifications";
import { Button, Text, TextField } from "@shared/ui";
import React, { FC, memo, useCallback, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ANCHOR_LIST_FIELDS, IAnchorListField } from "./anchor-list-fields";

const ESTIMATED_ROW_HEIGHT = 84;

const keyExtractor = (field: IAnchorListField) => field.key;

/**
 * Временный пример: поля формы строками AnchorList, подключение —
 * `useKeyboardAwareAnchorList` (ref, якорь в шапке, распорка в футере,
 * реестр полей).
 */
export const KeyboardAnchorListDemo: FC = memo(() => {
  const toast = useNotifications();
  const { bottom } = useSafeAreaInsets();
  const [values, setValues] = useState<Record<string, string>>({});

  const footer = useMemo(
    () => (
      <Button
        title={"Сохранить"}
        style={[styles.footer, { marginBottom: bottom + 16 }]}
        onPress={() =>
          toast.success(JSON.stringify(values, null, 2), {
            title: "Сохранено",
          })
        }
      />
    ),
    [bottom, toast, values],
  );

  const header = useMemo(
    () => (
      <Text textStyle={"Body_S2"} color={"textSecondary"}>
        {
          "Строки списка — поля формы. Фокус на любом поднимает его над клавиатурой целиком."
        }
      </Text>
    ),
    [],
  );

  const keyboardAware = useKeyboardAwareAnchorList({
    ListHeaderComponent: header,
    ListFooterComponent: footer,
  });

  const renderItem = useCallback(
    ({ item }: IAnchorListRenderItemProps<IAnchorListField>) => (
      <TextField
        label={item.label}
        description={item.description}
        multiline={item.multiline}
        value={values[item.key] ?? ""}
        onChangeText={text =>
          setValues(current => ({ ...current, [item.key]: text }))
        }
      />
    ),
    [values],
  );

  return keyboardAware.wrap(
    <AnchorList<IAnchorListField>
      {...keyboardAware.listProps}
      data={ANCHOR_LIST_FIELDS}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      extraData={values}
      estimatedItemSize={ESTIMATED_ROW_HEIGHT}
      gap={12}
      keyboardShouldPersistTaps={"handled"}
      contentContainerStyle={styles.content}
      style={styles.list}
    />,
  );
});

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  footer: {
    marginTop: 4,
  },
});
