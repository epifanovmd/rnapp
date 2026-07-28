import { createDisposer } from "@shared/lib/di";
import { injectable } from "inversify";

import { ISocketTransport } from "../transport";
import { IUserSocketService, UserSocketHandlers } from "./user.socket.types";

@injectable()
export class UserSocketService implements IUserSocketService {
  constructor(@ISocketTransport() private _transport: ISocketTransport) {}

  subscribe(handlers: UserSocketHandlers): () => void {
    const disposers = createDisposer();

    if (handlers.onProfileUpdated) {
      // Если сокет уже подключён — отправляем подписку сразу.
      // onConnect сработает ТОЛЬКО при будущих переподключениях (не ретроактивно),
      // поэтому дубля не будет.
      if (this._transport.state.status === "connected") {
        this._transport.emit("profile:subscribe");
      }

      disposers.add(
        this._transport.onConnect(() => {
          this._transport.emit("profile:subscribe");
        }),
        this._transport.on("profile:updated", handlers.onProfileUpdated),
      );
    }
    if (handlers.onUsernameChanged) {
      disposers.add(
        this._transport.on("user:username-changed", handlers.onUsernameChanged),
      );
    }
    if (handlers.onEmailVerified) {
      disposers.add(
        this._transport.on("user:email-verified", handlers.onEmailVerified),
      );
    }
    if (handlers.onPrivilegesChanged) {
      disposers.add(
        this._transport.on(
          "user:privileges-changed",
          handlers.onPrivilegesChanged,
        ),
      );
    }
    if (handlers.onPrivacyChanged) {
      disposers.add(
        this._transport.on(
          "profile:privacy-changed",
          handlers.onPrivacyChanged,
        ),
      );
    }
    if (handlers.onNewSession) {
      disposers.add(this._transport.on("session:new", handlers.onNewSession));
    }
    if (handlers.onSessionTerminated) {
      disposers.add(
        this._transport.on("session:terminated", handlers.onSessionTerminated),
      );
    }
    if (handlers.onPasswordChanged) {
      disposers.add(
        this._transport.on("user:password-changed", handlers.onPasswordChanged),
      );
    }

    return disposers.dispose;
  }
}
