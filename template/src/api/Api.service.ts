import {
  ApiService,
  IApiService as IIIApiService,
  iocDecorator,
} from "@force-dev/utils";
import Config from "react-native-config";

import { ITokenService } from "~@service";

export const BASE_URL = Config.BASE_URL;
export const SOCKET_BASE_URL = Config.SOCKET_BASE_URL;

export interface IApiService extends IIIApiService {}
export const IApiService = iocDecorator<ApiService1>();

@IApiService({ inSingleton: true })
class ApiService1 extends ApiService {
  constructor() {
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
      const token = ITokenService.getInstance().token;

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return request;
    });
  }
}

const apiService = IApiService.getInstance();

export const axiosInstance = apiService.instance;

export type IAxiosInstance = typeof axiosInstance;
export const IAxiosInstance =
  iocDecorator<IAxiosInstance>().toConstantValue(axiosInstance);
