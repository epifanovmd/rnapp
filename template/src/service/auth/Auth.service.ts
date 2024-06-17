import { IApiService } from "../../api";
import { IAuthService, ILoginRequest, IProfile } from "./Auth.types";

@IAuthService()
export class AuthService implements IAuthService {
  constructor(@IApiService() private _apiService: IApiService) {}

  login(credentials: ILoginRequest) {
    return this._apiService.post<IProfile, ILoginRequest>(
      "auth/login",
      credentials,
    );
  }
}
