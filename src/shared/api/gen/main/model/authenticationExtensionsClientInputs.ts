/**
 * Расширения, которые сервер запрашивает у аутентификатора.
 */
export interface AuthenticationExtensionsClientInputs {
  appid?: string;
  credProps?: boolean;
  hmacCreateSecret?: boolean;
  minPinLength?: boolean;
}
