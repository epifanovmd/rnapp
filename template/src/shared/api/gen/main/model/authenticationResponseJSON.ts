import type { AuthenticationExtensionsClientOutputs } from "./authenticationExtensionsClientOutputs";
import type { AuthenticatorAssertionResponseJSON } from "./authenticatorAssertionResponseJSON";
import type { AuthenticatorAttachment } from "./authenticatorAttachment";
import type { Base64URLString } from "./base64URLString";
import type { PublicKeyCredentialType } from "./publicKeyCredentialType";

/**
 * A slightly-modified AuthenticationCredential to simplify working with ArrayBuffers that
 * are Base64URL-encoded in the browser so that they can be sent as JSON to the server.
 *
 * https://w3c.github.io/webauthn/#dictdef-authenticationresponsejson
 */
export interface AuthenticationResponseJSON {
  id: Base64URLString;
  rawId: Base64URLString;
  response: AuthenticatorAssertionResponseJSON;
  authenticatorAttachment?: AuthenticatorAttachment;
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
  type: PublicKeyCredentialType;
}
