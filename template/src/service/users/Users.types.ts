import { iocDecorator } from "@force-dev/utils";

import { ApiAbortPromise, ApiResponse } from "../../api";

export const IUsersService = iocDecorator<IUsersService>();

export interface IUsersService {
  getUsers(): ApiAbortPromise<ApiResponse<IUserResponse>>;
}

export type IUserResponse = {
  limit: number;
  skip: number;
  total: number;
  users: IUser[];
};

export interface IUser {
  id: number;
  firstName: string;
  lastName: string;
  maidenName: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  birthDate: string;
  image: string;
  bloodGroup: string;
  height: number;
  weight: number;
  eyeColor: string;
  hair: Hair;
  ip: string;
  address: Address;
  macAddress: string;
  university: string;
  bank: Bank;
  company: Company;
  ein: string;
  ssn: string;
  userAgent: string;
  crypto: Crypto;
  role: string;
}

interface Crypto {
  coin: string;
  wallet: string;
  network: string;
}
interface Company {
  department: string;
  name: string;
  title: string;
  address: Address;
}
interface Bank {
  cardExpire: string;
  cardNumber: string;
  cardType: string;
  currency: string;
  iban: string;
}
interface Address {
  address: string;
  city: string;
  state: string;
  stateCode: string;
  postalCode: string;
  coordinates: Coordinates;
  country: string;
}
interface Coordinates {
  lat: number;
  lng: number;
}
interface Hair {
  color: string;
  type: string;
}
