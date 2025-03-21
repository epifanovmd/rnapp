import { createServiceDecorator } from "@force-dev/utils";

export const IClientsSocketService =
  createServiceDecorator<IClientsSocketService>();

export interface IClientsSocketService {}

export interface ClientsSocketEvents {}

export interface ClientSocketEmitEvents {}
