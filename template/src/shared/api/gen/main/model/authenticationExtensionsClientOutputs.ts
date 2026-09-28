import type { CredentialPropertiesOutput } from "./credentialPropertiesOutput";

/**
 * Результаты расширений от аутентификатора.
 */
export interface AuthenticationExtensionsClientOutputs {
  appid?: boolean;
  credProps?: CredentialPropertiesOutput;
  hmacCreateSecret?: boolean;
}
