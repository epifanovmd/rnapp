export interface SessionDto {
  id: string;
  userId: string;
  /** @nullable */
  deviceName: string | null;
  /** @nullable */
  deviceType: string | null;
  /** @nullable */
  ip: string | null;
  /** @nullable */
  userAgent: string | null;
  lastActiveAt: string;
  createdAt: string;
}
