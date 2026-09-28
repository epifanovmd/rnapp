import { injectable } from "inversify";
import {
  RTCIceCandidate as RNRTCIceCandidate,
  RTCPeerConnection as RNRTCPeerConnection,
  RTCSessionDescription as RNRTCSessionDescription,
} from "react-native-webrtc";

import { IWebRTCService } from "./webrtc.types";

const DEFAULT_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

@injectable()
export class WebRTCService implements IWebRTCService {
  createPeerConnection(config?: RTCConfiguration): RTCPeerConnection {
    return new (RNRTCPeerConnection as any)({
      iceServers: DEFAULT_ICE_SERVERS,
      ...config,
    }) as RTCPeerConnection;
  }

  async createOffer(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
    const offer = await pc.createOffer({} as any);

    await pc.setLocalDescription(offer as any);

    return offer as RTCSessionDescriptionInit;
  }

  async createAnswer(
    pc: RTCPeerConnection,
  ): Promise<RTCSessionDescriptionInit> {
    const answer = await pc.createAnswer({} as any);

    await pc.setLocalDescription(answer as any);

    return answer as RTCSessionDescriptionInit;
  }

  async setRemoteDescription(
    pc: RTCPeerConnection,
    sdp: RTCSessionDescriptionInit,
  ): Promise<void> {
    await pc.setRemoteDescription(
      new (RNRTCSessionDescription as any)(sdp) as any,
    );
  }

  async addIceCandidate(
    pc: RTCPeerConnection,
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    await pc.addIceCandidate(new (RNRTCIceCandidate as any)(candidate) as any);
  }
}
