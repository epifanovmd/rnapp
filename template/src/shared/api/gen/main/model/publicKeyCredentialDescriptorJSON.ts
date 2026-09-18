import type { AuthenticatorTransportFuture } from "./authenticatorTransportFuture";
import type { Base64URLString } from "./base64URLString";
import type { PublicKeyCredentialType } from "./publicKeyCredentialType";

/**
 * https://w3c.github.io/webauthn/#dictdef-publickeycredentialdescriptorjson
 */
export interface PublicKeyCredentialDescriptorJSON {
  id: Base64URLString;
  type: PublicKeyCredentialType;
  transports?: AuthenticatorTransportFuture[];
}
