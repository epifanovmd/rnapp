import type { AuthenticationExtensionsClientOutputs } from "./authenticationExtensionsClientOutputs";
import type { AuthenticatorAssertionResponseJSON } from "./authenticatorAssertionResponseJSON";
import type { AuthenticatorAttachment } from "./authenticatorAttachment";
import type { Base64URLString } from "./base64URLString";
import type { PublicKeyCredentialType } from "./publicKeyCredentialType";

/**
 * Ответ браузера на вход по passkey.
 */
export interface AuthenticationResponseJSON {
  id: Base64URLString;
  rawId: Base64URLString;
  response: AuthenticatorAssertionResponseJSON;
  authenticatorAttachment?: AuthenticatorAttachment;
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
  type: PublicKeyCredentialType;
}
