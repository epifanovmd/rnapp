import { createServiceDecorator } from "@di";

export interface IWebRTCService {
  createPeerConnection(config?: RTCConfiguration): RTCPeerConnection;

  getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>;

  createOffer(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit>;
  createAnswer(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit>;
  setRemoteDescription(
    pc: RTCPeerConnection,
    sdp: RTCSessionDescriptionInit,
  ): Promise<void>;
  addIceCandidate(
    pc: RTCPeerConnection,
    candidate: RTCIceCandidateInit,
  ): Promise<void>;

  stopStream(stream: MediaStream): void;
}

export const IWebRTCService = createServiceDecorator<IWebRTCService>();
