import { IMediaService } from "../platform/IMediaService";
import { IWebRTCService } from "./WebRTCService.types";

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

@IWebRTCService({ inSingleton: true })
export class WebRTCService implements IWebRTCService {
  constructor(@IMediaService() private _media: IMediaService) {}

  createPeerConnection(config?: RTCConfiguration): RTCPeerConnection {
    return new RTCPeerConnection({
      iceServers: DEFAULT_ICE_SERVERS,
      ...config,
    });
  }

  async getUserMedia(
    constraints?: MediaStreamConstraints,
  ): Promise<MediaStream> {
    return this._media.getUserMedia(
      constraints ?? { audio: true, video: false },
    );
  }

  async createOffer(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
    const offer = await pc.createOffer();

    await pc.setLocalDescription(offer);

    return offer;
  }

  async createAnswer(
    pc: RTCPeerConnection,
  ): Promise<RTCSessionDescriptionInit> {
    const answer = await pc.createAnswer();

    await pc.setLocalDescription(answer);

    return answer;
  }

  async setRemoteDescription(
    pc: RTCPeerConnection,
    sdp: RTCSessionDescriptionInit,
  ): Promise<void> {
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  async addIceCandidate(
    pc: RTCPeerConnection,
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  stopStream(stream: MediaStream): void {
    stream.getTracks().forEach(track => track.stop());
  }
}
