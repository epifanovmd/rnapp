import type { AuthenticationExtensionsClientInputs } from "./authenticationExtensionsClientInputs";
import type { Base64URLString } from "./base64URLString";
import type { PublicKeyCredentialDescriptorJSON } from "./publicKeyCredentialDescriptorJSON";
import type { UserVerificationRequirement } from "./userVerificationRequirement";

/**
 * A variant of PublicKeyCredentialRequestOptions suitable for JSON transmission to the browser to
 * (eventually) get passed into navigator.credentials.get(...) in the browser.
 */
export interface PublicKeyCredentialRequestOptionsJSON {
  challenge: Base64URLString;
  timeout?: number;
  rpId?: string;
  allowCredentials?: PublicKeyCredentialDescriptorJSON[];
  userVerification?: UserVerificationRequirement;
  extensions?: AuthenticationExtensionsClientInputs;
}
