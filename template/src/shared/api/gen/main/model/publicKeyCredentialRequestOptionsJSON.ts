import type { AuthenticationExtensionsClientInputs } from "./authenticationExtensionsClientInputs";
import type { Base64URLString } from "./base64URLString";
import type { PublicKeyCredentialDescriptorJSON } from "./publicKeyCredentialDescriptorJSON";
import type { UserVerificationRequirement } from "./userVerificationRequirement";

/**
 * Опции для `navigator.credentials.get()`.
 */
export interface PublicKeyCredentialRequestOptionsJSON {
  challenge: Base64URLString;
  timeout?: number;
  rpId?: string;
  allowCredentials?: PublicKeyCredentialDescriptorJSON[];
  userVerification?: UserVerificationRequirement;
  hints?: string[];
  extensions?: AuthenticationExtensionsClientInputs;
}
