import { ContainerModule } from "inversify";

import { MediaService } from "./media.service";
import { IMediaService } from "./media.types";

export const mediaModule = new ContainerModule(({ bind }) => {
  bind(IMediaService.Tid).to(MediaService).inSingletonScope();
});
