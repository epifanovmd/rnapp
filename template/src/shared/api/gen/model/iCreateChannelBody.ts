export interface ICreateChannelBody {
  name: string;
  description?: string;
  username?: string;
  avatarId?: string;
  isPublic?: boolean;
}
