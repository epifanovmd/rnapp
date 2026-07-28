export interface IUpdateChannelBody {
  name?: string;
  /** @nullable */
  description?: string | null;
  /** @nullable */
  username?: string | null;
  /** @nullable */
  avatarId?: string | null;
  isPublic?: boolean;
}
