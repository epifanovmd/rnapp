import { ContainerModule } from "inversify";

import { WebRTCService } from "./webrtc.service";
import { IWebRTCService } from "./webrtc.types";

export const webrtcModule = new ContainerModule(({ bind }) => {
  bind(IWebRTCService.Tid).to(WebRTCService).inSingletonScope();
});
