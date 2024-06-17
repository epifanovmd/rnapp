import { notificationService } from "@force-dev/react-mobile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosInstance } from "axios";
import { stringify } from "query-string";
import Config from "react-native-config";
import SetCookieParser from "set-cookie-parser";

import { DebugVars } from "../../debugVars";
import { log } from "../service";
import { ISessionDataStore } from "../store/session";
import {
  ApiAbortPromise,
  ApiRequestConfig,
  ApiResponse,
  IApiService,
} from "./Api.types";

export const BASE_URL = Config.BASE_URL;
export const SOCKET_BASE_URL = Config.SOCKET_BASE_URL;

@IApiService({ inSingleton: true })
export class ApiService implements IApiService {
  private instance: AxiosInstance;
  private raceConditionMap: Map<string, AbortController> = new Map();

  constructor(
    @ISessionDataStore() private _sessionDataStore: ISessionDataStore,
  ) {
    this.instance = axios.create({
      timeout: 2 * 60 * 1000,
      withCredentials: true,
      baseURL: BASE_URL,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    this.instance.interceptors.request.use(async request => {
      await AsyncStorage.getItem("token").then(token => {
        request.headers.set("Authorization", `Bearer ${token}`);
      });

      if (DebugVars.logRequest) {
        console.log(
          "Start request with url = ",
          request.url,
          "params = ",
          JSON.stringify(request.params ?? request.data ?? {}),
        );
      }

      return request;
    });

    this.instance.interceptors.response.use(
      response => {
        const sch = response.headers["set-cookie"] || [];
        const parsed = SetCookieParser.parse(sch);
        const token = parsed.find(item => item.name === "token")?.value;

        if (token) {
          this._sessionDataStore.setToken(token);
        }

        return { data: response } as any;
      },
      (
        e,
      ): Promise<{
        data: {
          error: Error;
        };
      }> => {
        const status = e?.response?.status || 500;

        if (status === 401) {
          this._sessionDataStore.clearToken();
        }

        const error: Error = new Error(e.message ?? e.response.data ?? e);

        if (e && e?.message !== "canceled" && status !== 401) {
          notificationService.show(error.message, {
            type: "danger",
            swipeEnabled: false,
            onPress() {
              notificationService.hide().then();
            },
          });
        }

        log.error("API Error - ", error);

        return Promise.resolve({
          data: {
            error,
          },
        });
      },
    );
  }

  public get<R = any, P = any>(
    endpoint: string,
    params?: P,
    config?: ApiRequestConfig,
  ) {
    const query = params && stringify(params);
    const controller = this.raceCondition(endpoint, config?.useRaceCondition);

    const promise = this.instance
      .get<ApiResponse<R>>(endpoint + (query ? `?${query}` : ""), {
        ...config,
        signal: controller.signal,
      })
      .then(response => response.data) as ApiAbortPromise<ApiResponse<R>>;

    promise.abort = () => controller.abort();

    return promise;
  }

  public post<R = any, P = any>(
    endpoint: string,
    params?: P,
    config?: ApiRequestConfig,
  ) {
    const controller = this.raceCondition(endpoint, config?.useRaceCondition);

    const promise = this.instance
      .post<ApiResponse<R>>(endpoint, params, {
        ...config,
        signal: controller.signal,
      })
      .then(response => response.data) as ApiAbortPromise<ApiResponse<R>>;

    promise.abort = () => controller.abort();

    return promise;
  }

  public patch<R = any, P = any>(
    endpoint: string,
    params?: P,
    config?: ApiRequestConfig,
  ) {
    const controller = this.raceCondition(endpoint, config?.useRaceCondition);

    const promise = this.instance
      .patch<ApiResponse<R>>(endpoint, params, {
        ...config,
        signal: controller.signal,
      })
      .then(response => response.data) as ApiAbortPromise<ApiResponse<R>>;

    promise.abort = () => controller.abort();

    return promise;
  }

  public put<R = any, P = any>(
    endpoint: string,
    params?: P,
    config?: ApiRequestConfig,
  ) {
    const controller = this.raceCondition(endpoint, config?.useRaceCondition);

    const promise = this.instance
      .put<ApiResponse<R>>(endpoint, params, {
        ...config,
        signal: controller.signal,
      })
      .then(response => response.data) as ApiAbortPromise<ApiResponse<R>>;

    promise.abort = () => controller.abort();

    return promise;
  }

  public delete<R = any>(endpoint: string, config?: ApiRequestConfig) {
    const controller = this.raceCondition(endpoint, config?.useRaceCondition);

    const promise = this.instance
      .delete(endpoint, {
        ...config,
        signal: controller.signal,
      })
      .then(response => response.data) as ApiAbortPromise<ApiResponse<R>>;

    promise.abort = () => controller.abort();

    return promise;
  }

  private raceCondition(endpoint: string, useRaceCondition?: boolean) {
    const controller = new AbortController();

    if (useRaceCondition) {
      if (this.raceConditionMap.has(endpoint)) {
        this.raceConditionMap.get(endpoint)?.abort();
        this.raceConditionMap.delete(endpoint);
      }
      this.raceConditionMap.set(endpoint, controller);
    }

    return controller;
  }
}
