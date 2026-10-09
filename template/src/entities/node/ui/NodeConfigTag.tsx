import type { INodeConfigDto } from "@shared/api/gen/main/model";
import { useNotifications } from "@shared/lib/notifications";
import { Tag, Touchable } from "@shared/ui";
import React, { FC } from "react";

import { nodeConfigView } from "../lib/status";

interface INodeConfigTagProps {
  config: INodeConfigDto;
}

/** Сводка настроек воркеров узла; ключи с ошибкой и в ожидании — по нажатию. */
export const NodeConfigTag: FC<INodeConfigTagProps> = ({ config }) => {
  const toast = useNotifications();
  const view = nodeConfigView(config);
  const tag = <Tag variant={view.variant}>{view.label}</Tag>;

  if (!view.hint) return tag;

  const hint = view.hint;

  return (
    <Touchable onPress={() => toast.info(hint, { title: view.label })}>
      {tag}
    </Touchable>
  );
};
