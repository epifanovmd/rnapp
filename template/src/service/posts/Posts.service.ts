import { IApiService } from "../../api";
import {
  IPost,
  IPostSearchRequest,
  IPostsRequest,
  IPostsResponse,
  IPostsService,
} from "./Posts.types";

@IPostsService()
export class PostsService implements IPostsService {
  constructor(@IApiService() private _apiService: IApiService) {}

  getAll(params?: IPostsRequest) {
    return this._apiService.get<IPostsResponse, IPostsRequest>("posts", params);
  }

  getPost(id: number) {
    return this._apiService.get<IPost, IPostsRequest>(`posts/${id}`);
  }

  search(params: IPostSearchRequest) {
    return this._apiService.get<IPostsResponse, IPostSearchRequest>(
      "posts/search",
      params,
    );
  }
}
