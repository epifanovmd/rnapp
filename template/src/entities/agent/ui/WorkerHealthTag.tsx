import type { IAgentWorkerDto } from "@shared/api/gen/main/model";
import React, { FC } from "react";

import { workerHealthView } from "../lib/status";
import { StatusViewTag } from "./StatusViewTag";

interface IWorkerHealthTagProps {
  worker: IAgentWorkerDto;
}

/** Самочувствие воркера по `GET /health`; сообщение — по нажатию. Ответа нет — ничего. */
export const WorkerHealthTag: FC<IWorkerHealthTagProps> = ({ worker }) => {
  const view = workerHealthView(worker);

  return view ? (
    <StatusViewTag view={view} message={worker.health?.message} />
  ) : null;
};
