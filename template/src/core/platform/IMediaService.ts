import { createServiceDecorator } from "@di";
import { mediaDevices } from "react-native-webrtc";

/**
 * Абстракция доступа к медиа-устройствам.
 * React Native: react-native-webrtc mediaDevices.
 */
export interface IMediaService {
  getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>;
}

export const IMediaService = createServiceDecorator<IMediaService>();

@IMediaService({ inSingleton: true })
export class RNMediaService implements IMediaService {
  async getUserMedia(
    constraints?: MediaStreamConstraints,
  ): Promise<MediaStream> {
    const stream = await mediaDevices.getUserMedia(
      (constraints ?? { audio: true, video: false }) as any,
    );

    return stream as unknown as MediaStream;
  }
}
