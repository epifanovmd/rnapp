import { createInjectDecorator } from "@shared/lib/di";

/**
 * Абстракция над WebRTC-примитивами (peer connection / SDP / ICE).
 * За медиапотоками — см. IMediaService (отдельная ответственность).
 */
export const IWebRTCService =
  createInjectDecorator<IWebRTCService>("IWebRTCService");

export interface IWebRTCService {
  createPeerConnection(config?: RTCConfiguration): RTCPeerConnection;

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
}
