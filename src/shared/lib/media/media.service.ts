import { injectable } from "inversify";
import { mediaDevices } from "react-native-webrtc";

import { IMediaService } from "./media.types";

@injectable()
export class MediaService implements IMediaService {
  async getUserMedia(
    constraints?: MediaStreamConstraints,
  ): Promise<MediaStream> {
    const stream = await mediaDevices.getUserMedia(
      (constraints ?? { audio: true, video: false }) as any,
    );

    return stream as unknown as MediaStream;
  }

  stopStream(stream: MediaStream): void {
    stream.getTracks().forEach(track => track.stop());
  }
}
