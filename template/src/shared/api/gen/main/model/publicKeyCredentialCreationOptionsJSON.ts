import type { AttestationConveyancePreference } from "./attestationConveyancePreference";
import type { AuthenticationExtensionsClientInputs } from "./authenticationExtensionsClientInputs";
import type { AuthenticatorSelectionCriteria } from "./authenticatorSelectionCriteria";
import type { Base64URLString } from "./base64URLString";
import type { PublicKeyCredentialDescriptorJSON } from "./publicKeyCredentialDescriptorJSON";
import type { PublicKeyCredentialParameters } from "./publicKeyCredentialParameters";
import type { PublicKeyCredentialRpEntity } from "./publicKeyCredentialRpEntity";
import type { PublicKeyCredentialUserEntityJSON } from "./publicKeyCredentialUserEntityJSON";

/**
 * Опции для `navigator.credentials.create()`.
 */
export interface PublicKeyCredentialCreationOptionsJSON {
  rp: PublicKeyCredentialRpEntity;
  user: PublicKeyCredentialUserEntityJSON;
  challenge: Base64URLString;
  pubKeyCredParams: PublicKeyCredentialParameters[];
  timeout?: number;
  excludeCredentials?: PublicKeyCredentialDescriptorJSON[];
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  hints?: string[];
  attestation?: AttestationConveyancePreference;
  attestationFormats?: string[];
  extensions?: AuthenticationExtensionsClientInputs;
}
