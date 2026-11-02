import type { AuthenticationExtensionsClientOutputs } from "./authenticationExtensionsClientOutputs";
import type { AuthenticatorAttachment } from "./authenticatorAttachment";
import type { AuthenticatorAttestationResponseJSON } from "./authenticatorAttestationResponseJSON";
import type { Base64URLString } from "./base64URLString";
import type { PublicKeyCredentialType } from "./publicKeyCredentialType";

/**
 * Ответ браузера на регистрацию passkey.
 */
export interface RegistrationResponseJSON {
  id: Base64URLString;
  rawId: Base64URLString;
  response: AuthenticatorAttestationResponseJSON;
  authenticatorAttachment?: AuthenticatorAttachment;
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
  type: PublicKeyCredentialType;
}
