import { IApiService } from "../../api";
import {
  IProfile,
  IProfileService,
  IRefreshTokenRequest,
  IRefreshTokenResponse,
  ISignInRequest,
  ISignInResponse,
} from "./Profile.types";

@IProfileService()
export class ProfileService implements IProfileService {
  constructor(@IApiService() private _apiService: IApiService) {}

  signIn(credentials: ISignInRequest) {
    return this._apiService.post<ISignInResponse, ISignInRequest>(
      "auth/login",
      credentials,
    );
  }

  // signUp(credentials: ISignUpRequest) {
  //   return this._apiService.post<ISignUpResponse, ISignUpRequest>(
  //     "auth/signUp",
  //     credentials,
  //   );
  // }

  refresh(params: IRefreshTokenRequest) {
    return this._apiService.post<IRefreshTokenResponse, IRefreshTokenRequest>(
      "auth/refresh",
      params,
    );
  }

  getProfile() {
    return this._apiService.get<IProfile>("auth/me");
  }
}
