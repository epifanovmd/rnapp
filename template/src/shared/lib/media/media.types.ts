import { createInjectDecorator } from "@shared/lib/di";

/**
 * Абстракция доступа к медиа-устройствам.
 * React Native: react-native-webrtc mediaDevices.
 */
export interface IMediaService {
  getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>;
  stopStream(stream: MediaStream): void;
}

export const IMediaService = createInjectDecorator<IMediaService>();
