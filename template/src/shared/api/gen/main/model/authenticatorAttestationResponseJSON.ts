import type { AuthenticatorTransportFuture } from "./authenticatorTransportFuture";
import type { Base64URLString } from "./base64URLString";
import type { COSEAlgorithmIdentifier } from "./cOSEAlgorithmIdentifier";

/**
 * A slightly-modified AuthenticatorAttestationResponse to simplify working with ArrayBuffers that
 * are Base64URL-encoded in the browser so that they can be sent as JSON to the server.
 *
 * https://w3c.github.io/webauthn/#dictdef-authenticatorattestationresponsejson
 */
export interface AuthenticatorAttestationResponseJSON {
  clientDataJSON: Base64URLString;
  attestationObject: Base64URLString;
  authenticatorData?: Base64URLString;
  transports?: AuthenticatorTransportFuture[];
  publicKeyAlgorithm?: COSEAlgorithmIdentifier;
  publicKey?: Base64URLString;
}
