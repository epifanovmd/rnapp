import type {
  MessengerSocketClientEvents,
  MessengerSocketServerEvents,
} from "./messenger.events";

/** All events the server emits → client listens */
export interface SocketServerToClientEvents
  extends MessengerSocketServerEvents {}

/** All events the client emits → server listens */
export interface SocketClientToServerEvents
  extends MessengerSocketClientEvents {}
