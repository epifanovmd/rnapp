import { ApiRequest, BaseResponse } from "@api";
import { ApiResponse, CancelablePromise, iocDecorator } from "@force-dev/utils";

export const IPostsService = iocDecorator<IPostsService>();

export interface IPostsService {
  getAll(
    params?: IPostsRequest,
  ): CancelablePromise<ApiResponse<IPostsResponse>>;

  getPost(id: number): CancelablePromise<ApiResponse<IPost>>;

  search(
    params: IPostSearchRequest,
  ): CancelablePromise<ApiResponse<IPostsResponse>>;
}

export interface IPost {
  id: number;
  title: string;
  body: string;
  tags: string[];
  reactions: IPostReactions;
  views: number;
  userId: number;
}

export interface IPostReactions {
  likes: number;
  dislikes: number;
}

export interface IPostsRequest extends ApiRequest {
  select?: keyof IPost;
  sortBy?: keyof IPost;
  order?: "asc" | "desc";
}

export interface IPostSearchRequest {
  q: string;
}

export interface IPostsResponse extends BaseResponse {
  posts: IPost[];
}
