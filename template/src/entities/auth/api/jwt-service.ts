import { injectable } from "inversify";

import { IAuthJwtService, type JwtPayload } from "./jwt-types";

@injectable()
export class AuthJwtService implements IAuthJwtService {
  parse(token: string): JwtPayload | null {
    try {
      const encoded = token.split(".")[1];

      if (!encoded) return null;

      // Base64url → base64 (RN atob не принимает "-"/"_" из JWT-алфавита)
      const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
      const raw = decodeURIComponent(
        Array.from(atob(base64))
          .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      const payload = JSON.parse(raw) as Record<string, unknown>;

      if (typeof payload.exp !== "number" || typeof payload.sub !== "string") {
        return null;
      }

      return payload as JwtPayload;
    } catch {
      return null;
    }
  }

  isExpired(token: string, bufferSeconds = 60): boolean {
    const payload = this.parse(token);

    if (!payload) return true;

    return Date.now() / 1000 > payload.exp - bufferSeconds;
  }

  getExpiresIn(token: string, bufferSeconds = 60): number {
    const payload = this.parse(token);

    if (!payload) return 0;

    return Math.max(0, payload.exp - Date.now() / 1000 - bufferSeconds);
  }
}
