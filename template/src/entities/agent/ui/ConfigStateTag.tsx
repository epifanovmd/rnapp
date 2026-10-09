import React, { FC } from "react";

import { configStateView } from "../lib/status";
import { StatusViewTag } from "./StatusViewTag";

interface IConfigStateTagProps {
  state: string;
}

/** Статус применения ключа настроек воркера. */
export const ConfigStateTag: FC<IConfigStateTagProps> = ({ state }) => (
  <StatusViewTag view={configStateView(state)} />
);
