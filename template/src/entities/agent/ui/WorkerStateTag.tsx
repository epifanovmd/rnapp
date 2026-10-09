import React, { FC } from "react";

import { workerStateView } from "../lib/status";
import { StatusViewTag } from "./StatusViewTag";

interface IWorkerStateTagProps {
  state: string;
  /** Причина состояния (у `invalid` — что не так с `/health` или `/manifest`). */
  message?: string;
}

/** Состояние воркера у агента; причина — по нажатию. */
export const WorkerStateTag: FC<IWorkerStateTagProps> = ({
  state,
  message,
}) => <StatusViewTag view={workerStateView(state)} message={message} />;
