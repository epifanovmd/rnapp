import {
  ApiService,
  createServiceDecorator,
  IApiService as IIIApiService,
} from "@force-dev/utils";
import { ITokenService } from "@service/token";
import Config from "react-native-config";

export const BASE_URL = Config.BASE_URL;
export const SOCKET_BASE_URL = Config.SOCKET_BASE_URL;

export interface IApiService extends IIIApiService {}
export const IApiService = createServiceDecorator<ApiService1>();

@IApiService({ inSingleton: true })
class ApiService1 extends ApiService {
  constructor(@ITokenService() private _tokenService: ITokenService) {
    super(
      {
        timeout: 2 * 60 * 1000,
        withCredentials: true,
        baseURL: BASE_URL,
      },
      error => error,
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
