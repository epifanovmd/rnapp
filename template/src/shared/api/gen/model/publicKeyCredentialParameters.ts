import type { COSEAlgorithmIdentifier } from "./cOSEAlgorithmIdentifier";
import type { PublicKeyCredentialType } from "./publicKeyCredentialType";

export interface PublicKeyCredentialParameters {
  alg: COSEAlgorithmIdentifier;
  type: PublicKeyCredentialType;
}
