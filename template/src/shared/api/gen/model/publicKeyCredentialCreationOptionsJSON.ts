import type { AttestationConveyancePreference } from "./attestationConveyancePreference";
import type { AuthenticationExtensionsClientInputs } from "./authenticationExtensionsClientInputs";
import type { AuthenticatorSelectionCriteria } from "./authenticatorSelectionCriteria";
import type { Base64URLString } from "./base64URLString";
import type { PublicKeyCredentialDescriptorJSON } from "./publicKeyCredentialDescriptorJSON";
import type { PublicKeyCredentialParameters } from "./publicKeyCredentialParameters";
import type { PublicKeyCredentialRpEntity } from "./publicKeyCredentialRpEntity";
import type { PublicKeyCredentialUserEntityJSON } from "./publicKeyCredentialUserEntityJSON";

/**
 * A variant of PublicKeyCredentialCreationOptions suitable for JSON transmission to the browser to
 * (eventually) get passed into navigator.credentials.create(...) in the browser.
 *
 * This should eventually get replaced with official TypeScript DOM types when WebAuthn L3 types
 * eventually make it into the language:
 *
 * https://w3c.github.io/webauthn/#dictdef-publickeycredentialcreationoptionsjson
 */
export interface PublicKeyCredentialCreationOptionsJSON {
  rp: PublicKeyCredentialRpEntity;
  user: PublicKeyCredentialUserEntityJSON;
  challenge: Base64URLString;
  pubKeyCredParams: PublicKeyCredentialParameters[];
  timeout?: number;
  excludeCredentials?: PublicKeyCredentialDescriptorJSON[];
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  attestation?: AttestationConveyancePreference;
  extensions?: AuthenticationExtensionsClientInputs;
}
