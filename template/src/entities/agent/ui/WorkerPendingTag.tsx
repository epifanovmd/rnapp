import React, { FC } from "react";

import { workerPendingView } from "../lib/status";
import { StatusViewTag } from "./StatusViewTag";

interface IWorkerPendingTagProps {
  /** `restart` | `update`. */
  pending: string;
}

/** Отложенная замена воркера: ждёт, пока он занят. */
export const WorkerPendingTag: FC<IWorkerPendingTagProps> = ({ pending }) => (
  <StatusViewTag view={workerPendingView(pending)} />
);
