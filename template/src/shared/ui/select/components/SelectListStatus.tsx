import React from "react";
import { StyleSheet, View } from "react-native";

import { Spinner } from "../../spinner";
import { Text } from "../../text";
import type { SelectValue } from "../types";
import type { ISelectListModel } from "./select-list-model";

export interface ISelectListStatusProps<V extends SelectValue> {
  model: ISelectListModel<V>;
}

/** Состояние списка вместо строк: загрузка, ошибка или пусто. */
export const SelectListStatus = <V extends SelectValue>({
  model,
}: ISelectListStatusProps<V>) => {
  const content = model.error ? model.errorContent : model.empty;

  if (!model.loading && content == null) return null;

  return (
    <View style={styles.status}>
      {model.loading ? (
        <Spinner size={24} />
      ) : typeof content === "string" ? (
        <Text color={"textSecondary"} textAlign={"center"}>
          {content}
        </Text>
      ) : (
        content
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  status: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
    paddingVertical: 16,
  },
});
