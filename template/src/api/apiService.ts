import Config from 'react-native-config';
import {stringify} from 'query-string';
import axios, {AxiosInstance, AxiosRequestConfig} from 'axios';
import SetCookieParser from 'set-cookie-parser';
import {ApiRequestConfig, ApiResponse} from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ISessionDataStore} from '../session';
import {DebugVars} from '../../debugVars';
import {notificationManager} from '@force-dev/react-mobile';

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

  public async get<R = any, P = any>(
    endpoint: string,
    params?: P,
    config?: ApiRequestConfig,
  ) {
    const query = params && stringify(params);
    const response = await this.instance!.get<ApiResponse<R>>(
      endpoint + (query ? `?${query}` : ''),
      {
        ...config,
        ...(config?.useRaceCondition ? this.raceCondition(endpoint) : {}),
      },
    );

    return response.data as ApiResponse<R>;
  }

  public async post<R = any, P = any>(
    endpoint: string,
    params?: P,
    config?: ApiRequestConfig,
  ) {
    const response = await this.instance!.post<ApiResponse<R>>(
      endpoint,
      params,
      {
        ...config,
        ...(config?.useRaceCondition ? this.raceCondition(endpoint) : {}),
      },
    );

    return response.data as ApiResponse<R>;
  }

  public async patch<R = any, P = any>(
    endpoint: string,
    params?: P,
    config?: ApiRequestConfig,
  ) {
    const response = await this.instance!.patch<ApiResponse<R>>(
      endpoint,
      params,
      {
        ...config,
        ...(config?.useRaceCondition ? this.raceCondition(endpoint) : {}),
      },
    );

    return response.data as ApiResponse<R>;
  }

  public async put<R = any, P = any>(
    endpoint: string,
    params?: P,
    config?: ApiRequestConfig,
  ) {
    const response = await this.instance!.put<ApiResponse<R>>(
      endpoint,
      params,
      {
        ...config,
        ...(config?.useRaceCondition ? this.raceCondition(endpoint) : {}),
      },
    );

    return response.data as ApiResponse<R>;
  }

  public async delete<R = any>(endpoint: string, config?: ApiRequestConfig) {
    const response = await this.instance!.delete<ApiResponse<R>>(endpoint, {
      ...config,
      ...(config?.useRaceCondition ? this.raceCondition(endpoint) : {}),
    });

    return response.data as ApiResponse<R>;
  }

  private raceCondition(endpoint: string) {
    const controller = new AbortController();

    if (this.raceConditionMap.has(endpoint)) {
      this.raceConditionMap.get(endpoint)?.abort();
      this.raceConditionMap.delete(endpoint);
    }
    this.raceConditionMap.set(endpoint, controller);

    return controller;
  }
}

export const apiService = new ApiService({baseURL: `${Config.BASE_URL}/api/`});
