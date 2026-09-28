import type { I2FARequiredDto } from "./i2FARequiredDto";
import type { IUserWithTokensDto } from "./iUserWithTokensDto";

export type ISignInResponseDto = IUserWithTokensDto | I2FARequiredDto;
