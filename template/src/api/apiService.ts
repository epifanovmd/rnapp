import Config from 'react-native-config';
import {stringify} from 'query-string';
import axios, {AxiosInstance, AxiosRequestConfig} from 'axios';
import SetCookieParser from 'set-cookie-parser';
import {ApiRequestConfig, ApiResponse} from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ISessionDataStore} from '../session';
import {DebugVars} from '../../debugVars';
import {notificationManager} from '@force-dev/react-mobile';

export interface AbortPromise<T> extends Promise<T> {
  abort: () => void;
}

export class ApiService {
  private instance: AxiosInstance | null = null;
  private raceConditionMap: Map<string, AbortController> = new Map();

  constructor(config?: AxiosRequestConfig) {
    this.instance = axios.create({
      timeout: 1000,
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
        console.log('Start request with url = ', request.url);
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
      error => {
        console.log('error', error.message);
        const status = error?.response?.status || 500;

        if (status === 401) {
          ISessionDataStore.getInstance().clearToken();
        }

        if (error && error?.message !== 'canceled' && status !== 401) {
          notificationManager.show(error.message, {
            type: 'danger',
            swipeEnabled: false,
            onPress(id: string) {
              notificationManager.hide(id);
            },
          });
        }

        return Promise.resolve({
          data: {
            error: {
              message: error.message,
              status,
              error,
            },
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

export const apiService = new ApiService({baseURL: `${Config.BASE_URL}/api/`});
