import type { AuthenticationExtensionsClientOutputs } from "./authenticationExtensionsClientOutputs";
import type { AuthenticatorAttachment } from "./authenticatorAttachment";
import type { AuthenticatorAttestationResponseJSON } from "./authenticatorAttestationResponseJSON";
import type { Base64URLString } from "./base64URLString";
import type { PublicKeyCredentialType } from "./publicKeyCredentialType";

/**
 * A slightly-modified RegistrationCredential to simplify working with ArrayBuffers that
 * are Base64URL-encoded in the browser so that they can be sent as JSON to the server.
 *
 * https://w3c.github.io/webauthn/#dictdef-registrationresponsejson
 */
export interface RegistrationResponseJSON {
  id: Base64URLString;
  rawId: Base64URLString;
  response: AuthenticatorAttestationResponseJSON;
  authenticatorAttachment?: AuthenticatorAttachment;
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
  type: PublicKeyCredentialType;
}
