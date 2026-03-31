import { createServiceDecorator } from "@di";

/**
 * Абстракция доступа к медиа-устройствам.
 * Web: navigator.mediaDevices. React Native: react-native-webrtc / expo-camera.
 */
export interface IMediaService {
  getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>;
}

export const IMediaService = createServiceDecorator<IMediaService>();

@IMediaService({ inSingleton: true })
export class WebMediaService implements IMediaService {
  async getUserMedia(
    constraints?: MediaStreamConstraints,
  ): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia(
      constraints ?? { audio: true, video: false },
    );
  }
}
