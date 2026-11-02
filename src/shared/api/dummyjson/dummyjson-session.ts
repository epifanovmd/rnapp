import { mapCancelable } from "@shared/lib/http";
import { TokenSession } from "@shared/lib/session";

import type {
  DummyJsonCredentials,
  IDummyJsonAuthApi,
  IDummyJsonSession,
} from "./dummyjson.types";

/**
 * Сессия DummyJSON поверх общего `TokenSession`: только память и реакция на
 * 401, потому что срок жизни токена бэкенд не отдаёт. Своего здесь лишь логин.
 */
export class DummyJsonSession
  extends TokenSession
  implements IDummyJsonSession
{
  constructor(private readonly _api: IDummyJsonAuthApi) {
    super({
      refresh: async refreshToken => {
        const { data, error } = await _api.refresh(refreshToken);

        if (error) throw error;

        return data;
      },
    });
  }

  login(credentials: DummyJsonCredentials) {
    return mapCancelable(this._api.login(credentials), res => {
      if (res.data) this.setTokens(res.data);

      return res;
    });
  }
}

export const createDummyJsonSession = (
  api: IDummyJsonAuthApi,
): IDummyJsonSession => new DummyJsonSession(api);
