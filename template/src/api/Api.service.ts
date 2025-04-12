import { ITokenService } from "@service/token";
import Config from "react-native-config";

import { ApiError, IApiService } from "./Api.types";
import { Api } from "./api-gen/Api";

export const BASE_URL = Config.BASE_URL;
export const SOCKET_BASE_URL = Config.SOCKET_BASE_URL;

@IApiService({ inSingleton: true })
class ApiService extends Api<ApiError, ApiError> implements IApiService {
  constructor(@ITokenService() private _tokenService: ITokenService) {
    super(
      {
        timeout: 2 * 60 * 1000,
        withCredentials: true,
        baseURL: BASE_URL,
      },
      error => {
        console.log("error", error);

        return new ApiError(
          error.response?.data.name ?? error.name,
          error.response?.data.message ?? error.message,
          error.status ?? 400,
          error.response?.data.reason ?? error.cause,
        );
      },
    );

    this.instance.interceptors.request.use(async request => {
      const headers = request.headers;
      const token = this._tokenService.accessToken;

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return request;
    });
  }
}
