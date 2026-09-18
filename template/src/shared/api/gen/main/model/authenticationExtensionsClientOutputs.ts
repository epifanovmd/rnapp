import type { CredentialPropertiesOutput } from "./credentialPropertiesOutput";

export interface AuthenticationExtensionsClientOutputs {
  appid?: boolean;
  credProps?: CredentialPropertiesOutput;
  hmacCreateSecret?: boolean;
}
