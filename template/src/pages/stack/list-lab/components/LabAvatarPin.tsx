import { Avatar } from "@shared/ui";
import React, { FC, memo } from "react";
import { StyleSheet, View } from "react-native";

import type { LabRow } from "../model";

interface ILabAvatarPinProps {
  row: LabRow;
}

/**
 * Прилипшая копия аватара для слоя поверх списка.
 *
 * У кромки стоит не строка, а аватар внутри неё, поэтому копию рисует стенд, а
 * не список. Горизонтальные отступы повторяют слот аватара в строке — иначе
 * копия встанет не на то место, откуда исчез оригинал.
 */
export const LabAvatarPin: FC<ILabAvatarPinProps> = memo(({ row }) => {
  if (row.type !== "message" || !row.isGroupTail) return null;

  return (
    <View style={ss.slot}>
      <Avatar size={36} name={row.author} />
    </View>
  );
});

LabAvatarPin.displayName = "LabAvatarPin";

const ss = StyleSheet.create({
  slot: { paddingLeft: 12, width: 56 },
});
