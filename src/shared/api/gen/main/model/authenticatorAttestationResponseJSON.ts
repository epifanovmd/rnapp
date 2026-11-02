import type { AuthenticatorTransportFuture } from "./authenticatorTransportFuture";
import type { Base64URLString } from "./base64URLString";
import type { COSEAlgorithmIdentifier } from "./cOSEAlgorithmIdentifier";

export interface AuthenticatorAttestationResponseJSON {
  clientDataJSON: Base64URLString;
  attestationObject: Base64URLString;
  authenticatorData?: Base64URLString;
  transports?: AuthenticatorTransportFuture[];
  publicKeyAlgorithm?: COSEAlgorithmIdentifier;
  publicKey?: Base64URLString;
}
