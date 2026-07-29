import { createInjectDecorator } from "@shared/lib/di";

export interface JwtPayload {
  sub: string;
  exp: number;
  iat: number;
  type?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface IAuthJwtService {
  parse(token: string): JwtPayload | null;
  isExpired(token: string, bufferSeconds?: number): boolean;
  getExpiresIn(token: string, bufferSeconds?: number): number;
}

export const IAuthJwtService =
  createInjectDecorator<IAuthJwtService>("IAuthJwtService");
