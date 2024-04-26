import {notificationService} from '@force-dev/react-mobile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, {AxiosInstance, AxiosRequestConfig} from 'axios';
import {stringify} from 'query-string';
import Config from 'react-native-config';
import SetCookieParser from 'set-cookie-parser';
import {DebugVars} from '../../debugVars';
import {log} from '../service';
import {ISessionDataStore} from '../session';
import {ApiError, ApiRequestConfig, ApiResponse, ErrorType} from './types';

export const BASE_URL = Config.BASE_URL;

export interface AbortPromise<T> extends Promise<T> {
  abort: () => void;
}

export class ExtractAbort {
  public ref: {abort?: () => void} = {};

  public getPromiseAbort = <R extends any>(promise: AbortPromise<R>) => {
    this.ref.abort = promise.abort;

    return promise;
  };
}

export class ApiService {
  private instance: AxiosInstance | null = null;
  private raceConditionMap: Map<string, AbortController> = new Map();
  private _hostname: string = '';

  constructor(config?: AxiosRequestConfig) {
    this._hostname = config?.baseURL ?? '';

    this.instance = axios.create({
      timeout: 2 * 60 * 1000,
      withCredentials: true,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      ...config,
    });

    this.instance.interceptors.request.use(async request => {
      await AsyncStorage.getItem('token').then(token => {
        request.headers.set('Authorization', `Bearer ${token}`);
      });

      if (DebugVars.logRequest) {
        console.log(
          'Start request with url = ',
          request.url,
          'params = ',
          JSON.stringify(request.params ?? request.data ?? {}),
        );
      }

      return request;
    });

    this.instance.interceptors.response.use(
      response => {
        const sch = response.headers['set-cookie'] || [];
        const parsed = SetCookieParser.parse(sch);
        const token = parsed.find(item => item.name === 'token')?.value;

        if (token) {
          ISessionDataStore.getInstance().setToken(token);
        }

        return {data: response} as any;
      },
      (
        e,
      ): Promise<{
        data: {
          error: ApiError;
        };
      }> => {
        const status = e?.response?.status || 500;

        if (status === 401) {
          ISessionDataStore.getInstance().clearToken();
        }

        let error: ApiError = new ApiError(
          status,
          ErrorType.ServerErrorException,
          e.message,
        );
        if (e.response) {
          error = e.response.data as ApiError;
        }

        if (e && e?.message !== 'canceled' && status !== 401) {
          notificationService.show(`${error.message} (${error.type})`, {
            type: 'danger',
            swipeEnabled: false,
            onPress() {
              notificationService.hide().then();
            },
          });
        }

        log.error('API Error - ', error);

        return Promise.resolve({
          data: {
            error,
          },
        });
      },
    );
  }

  public get hostname() {
    return this._hostname.replace('api/', '') || '/';
  }

  public toAbsoluteUrl(url?: string) {
    if (!url) {
      return undefined;
    }
    if (/(http(s?)|file):\/\//.test(url) || url.includes('://')) {
      return url;
    }
    return `${this.hostname}${url}`.replace('///', '//');
  }

  public get<R = any, P = any>(
    endpoint: string,
    params?: P,
    config?: ApiRequestConfig,
  ) {
    const query = params && stringify(params);
    const controller = this.raceCondition(endpoint, config?.useRaceCondition);

    const promise = this.instance!.get<ApiResponse<R>>(
      endpoint + (query ? `?${query}` : ''),
      {
        ...config,
        signal: controller.signal,
      },
    ).then(response => response.data) as AbortPromise<ApiResponse<R>>;

    promise.abort = () => controller.abort();

    return promise;
  }

  public post<R = any, P = any>(
    endpoint: string,
    params?: P,
    config?: ApiRequestConfig,
  ) {
    const controller = this.raceCondition(endpoint, config?.useRaceCondition);

    const promise = this.instance!.post<ApiResponse<R>>(endpoint, params, {
      ...config,
      signal: controller.signal,
    }).then(response => response.data) as AbortPromise<ApiResponse<R>>;

    promise.abort = () => controller.abort();

    return promise;
  }

  public patch<R = any, P = any>(
    endpoint: string,
    params?: P,
    config?: ApiRequestConfig,
  ) {
    const controller = this.raceCondition(endpoint, config?.useRaceCondition);

    const promise = this.instance!.patch<ApiResponse<R>>(endpoint, params, {
      ...config,
      signal: controller.signal,
    }).then(response => response.data) as AbortPromise<ApiResponse<R>>;

    promise.abort = () => controller.abort();

    return promise;
  }

  public async put<R = any, P = any>(
    endpoint: string,
    params?: P,
    config?: ApiRequestConfig,
  ) {
    const controller = this.raceCondition(endpoint, config?.useRaceCondition);

    const promise = (await this.instance!.put<ApiResponse<R>>(
      endpoint,
      params,
      {
        ...config,
        signal: controller.signal,
      },
    ).then(response => response.data)) as AbortPromise<ApiResponse<R>>;

    promise.abort = () => controller.abort();

    return promise;
  }

  public async delete<R = any>(endpoint: string, config?: ApiRequestConfig) {
    const controller = this.raceCondition(endpoint, config?.useRaceCondition);

    const promise = (await this.instance!.delete(endpoint, {
      ...config,
      signal: controller.signal,
    }).then(response => response.data)) as AbortPromise<ApiResponse<R>>;

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

export const apiService = new ApiService({baseURL: `${BASE_URL}`});
