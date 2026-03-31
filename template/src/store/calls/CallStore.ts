import { IApiService } from "@api";
import { CallDto, ECallType } from "@api/api-gen/data-contracts";
import { IWebRTCService } from "@core/webrtc";
import type {
  ISocketCallIceCandidateRelayPayload,
  ISocketCallRelayPayload,
} from "@socket";
import { IMessengerSocketService } from "@socket/messenger";
import { CollectionHolder, EntityHolder, MutationHolder } from "@store/holders";
import { CallModel } from "@store/models";
import { action, makeAutoObservable, observable, runInAction } from "mobx";

import { IAuthStore } from "../auth";
import { ICallStore } from "./CallStore.types";

@ICallStore({ inSingleton: true })
export class CallStore implements ICallStore {
  public activeCallHolder = new EntityHolder<CallDto>();
  public historyHolder = new CollectionHolder<CallDto>({
    keyExtractor: c => c.id,
  });
  public initiateMutation = new MutationHolder<
    { calleeId: string; type: ECallType },
    CallDto
  >();

  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;
  public isMuted = false;
  public isVideoEnabled = true;
  public incomingCall: CallDto | null = null;

  private _peerConnection: RTCPeerConnection | null = null;
  /** Stores the remote offer SDP until we're ready to process it */
  private _pendingOffer: ISocketCallRelayPayload | null = null;
  /** Queues ICE candidates received before remote description is set */
  private _pendingIceCandidates: RTCIceCandidateInit[] = [];
  /** True after setRemoteDescription completes — safe to add ICE candidates */
  private _remoteDescriptionSet = false;

  constructor(
    @IApiService() private _api: IApiService,
    @IWebRTCService() private _webrtc: IWebRTCService,
    @IMessengerSocketService() private _socket: IMessengerSocketService,
    @IAuthStore() private _authStore: IAuthStore,
  ) {
    makeAutoObservable(
      this,
      {
        localStream: observable.ref,
        remoteStream: observable.ref,
        handleIncomingCall: action,
        handleCallAnswered: action,
        handleCallDeclined: action,
        handleCallEnded: action,
        handleCallMissed: action,
        handleOffer: action,
        handleAnswer: action,
        handleIceCandidate: action,
      },
      { autoBind: true },
    );
  }

  get activeCall(): CallDto | null {
    return this.activeCallHolder.data;
  }

  get historyModels(): CallModel[] {
    return this.historyHolder.items.map(c => new CallModel(c));
  }

  get isLoading(): boolean {
    return this.historyHolder.isLoading;
  }

  async loadHistory(): Promise<void> {
    const res = await this._api.getCallHistory({ limit: 50 });

    if (res.data) {
      this.historyHolder.setItems(res.data.data);
    }
  }

  async loadActiveCall(): Promise<void> {
    await this.activeCallHolder.fromApi(() => this._api.getActiveCall());
  }

  // ── Caller side: initiate ──────────────────────────────────────────

  async initiateCall(calleeId: string, type: ECallType): Promise<void> {
    await this.initiateMutation.execute({ calleeId, type }, async args => {
      const res = await this._api.initiateCall({
        calleeId: args.calleeId,
        type: args.type,
      });

      if (res.data) {
        this.activeCallHolder.setData(res.data);
        this.isVideoEnabled = type === ECallType.Video;

        // 1. Create PeerConnection
        this._createPeerConnection(res.data);

        // 2. Get local media
        await this._setupLocalStream(type === ECallType.Video);

        // 3. Add local tracks to PC
        this._addLocalTracksToPC();

        // 4. Create and send offer
        const offer = await this._webrtc.createOffer(this._peerConnection!);

        console.log("[WebRTC] Sending offer, callId=%s", res.data.id);

        this._socket.emitCallOffer({
          callId: res.data.id,
          targetUserId: res.data.calleeId,
          sdp: offer,
        });
      }

      return res;
    });
  }

  // ── Callee side: answer ────────────────────────────────────────────

  async answerCall(callId: string): Promise<void> {
    const res = await this._api.answerCall({ id: callId });

    if (res.data) {
      const call = res.data;
      const isVideo = call.type === ECallType.Video;

      runInAction(() => {
        this.activeCallHolder.setData(res.data!);
        this.incomingCall = null;
        this.isVideoEnabled = isVideo;
      });

      // 1. Create PeerConnection
      this._createPeerConnection(call);

      // 2. Get local media
      await this._setupLocalStream(isVideo);

      // 3. Add local tracks to PC
      this._addLocalTracksToPC();

      // 4. If we already received the offer, process it now
      if (this._pendingOffer) {
        console.log("[WebRTC] Processing pending offer");
        await this._processOffer(this._pendingOffer);
        this._pendingOffer = null;
      }
    }
  }

  async declineCall(callId: string): Promise<void> {
    await this._api.declineCall({ id: callId });
    this.incomingCall = null;
  }

  async endCall(callId: string): Promise<void> {
    const call = this.activeCall;

    if (call) {
      const targetUserId =
        call.callerId === this._getMyUserId() ? call.calleeId : call.callerId;

      this._socket.emitHangup({ callId, targetUserId });
    }

    await this._api.endCall({ id: callId });
    this.cleanup();
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;

    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(t => {
        t.enabled = !this.isMuted;
      });
    }
  }

  toggleVideo(): void {
    this.isVideoEnabled = !this.isVideoEnabled;

    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(t => {
        t.enabled = this.isVideoEnabled;
      });
    }
  }

  // ── Socket handlers ────────────────────────────────────────────────

  handleIncomingCall(call: CallDto): void {
    this.incomingCall = call;
  }

  handleCallAnswered(call: CallDto): void {
    this.activeCallHolder.setData(call);
  }

  handleCallDeclined(call: CallDto): void {
    if (this.activeCall?.id === call.id) {
      this.cleanup();
    }
  }

  handleCallEnded(data: CallDto | { callId: string; endedBy: string }): void {
    const callId = "id" in data ? data.id : data.callId;

    if (this.activeCall?.id === callId) {
      this.cleanup();
    }
  }

  handleCallMissed(call: CallDto): void {
    if (this.incomingCall?.id === call.id) {
      this.incomingCall = null;
    }
  }

  /**
   * Received SDP offer from the caller.
   * If PeerConnection is ready (after answerCall), process immediately.
   * Otherwise, store as pending — it will be processed in answerCall.
   */
  handleOffer(data: ISocketCallRelayPayload): void {
    console.log("[WebRTC] handleOffer, pc ready=%s", !!this._peerConnection);

    if (this._peerConnection) {
      this._processOffer(data);
    } else {
      this._pendingOffer = data;
    }
  }

  /**
   * Received SDP answer from the callee (we are the caller).
   */
  handleAnswer(data: ISocketCallRelayPayload): void {
    if (!this._peerConnection) return;

    console.log("[WebRTC] handleAnswer — setting remote description");

    this._webrtc
      .setRemoteDescription(
        this._peerConnection,
        data.sdp as RTCSessionDescriptionInit,
      )
      .then(() => {
        this._remoteDescriptionSet = true;
        console.log(
          "[WebRTC] Remote description set (caller), flushing %d ICE candidates",
          this._pendingIceCandidates.length,
        );
        this._flushPendingIceCandidates();
      })
      .catch(err => {
        console.error(
          "[WebRTC] Failed to set remote description (answer):",
          err,
        );
      });
  }

  handleIceCandidate(data: ISocketCallIceCandidateRelayPayload): void {
    if (!this._peerConnection) return;

    const candidate = data.candidate as RTCIceCandidateInit;

    if (this._remoteDescriptionSet) {
      // Remote description is set — safe to add immediately
      this._webrtc
        .addIceCandidate(this._peerConnection, candidate)
        .catch(err => {
          console.warn("[WebRTC] Failed to add ICE candidate:", err);
        });
    } else {
      // Queue until remote description is set
      console.log("[WebRTC] Queuing ICE candidate (remote desc not set yet)");
      this._pendingIceCandidates.push(candidate);
    }
  }

  cleanup(): void {
    if (this.localStream) {
      this._webrtc.stopStream(this.localStream);
      this.localStream = null;
    }
    this.remoteStream = null;

    if (this._peerConnection) {
      this._peerConnection.close();
      this._peerConnection = null;
    }
    this._pendingOffer = null;
    this._pendingIceCandidates = [];
    this._remoteDescriptionSet = false;
    this.activeCallHolder.reset();
    this.incomingCall = null;
    this.isMuted = false;
    this.isVideoEnabled = true;
  }

  // ── Private helpers ────────────────────────────────────────────────

  private _createPeerConnection(call: CallDto): void {
    this._peerConnection = this._webrtc.createPeerConnection();
    this._remoteDescriptionSet = false;
    this._pendingIceCandidates = [];

    // When remote tracks arrive → set remoteStream
    this._peerConnection.ontrack = event => {
      console.log(
        "[WebRTC] ontrack: received remote track kind=%s",
        event.track.kind,
      );
      runInAction(() => {
        this.remoteStream = event.streams[0] ?? null;
      });
    };

    // When ICE candidates are generated → send to the other party
    const targetUserId =
      call.callerId === this._getMyUserId() ? call.calleeId : call.callerId;

    this._peerConnection.onicecandidate = event => {
      if (event.candidate) {
        this._socket.emitIceCandidate({
          callId: call.id,
          targetUserId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    this._peerConnection.oniceconnectionstatechange = () => {
      console.log(
        "[WebRTC] ICE connection state: %s",
        this._peerConnection?.iceConnectionState,
      );
    };

    this._peerConnection.onconnectionstatechange = () => {
      const state = this._peerConnection?.connectionState;

      console.log("[WebRTC] Connection state: %s", state);

      if (
        state === "disconnected" ||
        state === "failed" ||
        state === "closed"
      ) {
        console.warn("[WebRTC] Connection lost:", state);
      }
    };
  }

  private async _setupLocalStream(withVideo: boolean): Promise<void> {
    try {
      console.log(
        "[WebRTC] Getting local media: audio=true, video=%s",
        withVideo,
      );
      const stream = await this._webrtc.getUserMedia({
        audio: true,
        video: withVideo,
      });

      console.log(
        "[WebRTC] Local stream acquired: %d tracks",
        stream.getTracks().length,
      );
      stream.getTracks().forEach(t => {
        console.log(
          "[WebRTC]   track: kind=%s, enabled=%s, readyState=%s",
          t.kind,
          t.enabled,
          t.readyState,
        );
      });

      runInAction(() => {
        this.localStream = stream;
      });
    } catch (err) {
      console.error("[WebRTC] Failed to get local media:", err);
    }
  }

  private _addLocalTracksToPC(): void {
    if (!this._peerConnection || !this.localStream) {
      console.warn(
        "[WebRTC] Cannot add tracks: pc=%s, stream=%s",
        !!this._peerConnection,
        !!this.localStream,
      );

      return;
    }

    this.localStream.getTracks().forEach(track => {
      console.log("[WebRTC] Adding track to PC: kind=%s", track.kind);
      this._peerConnection!.addTrack(track, this.localStream!);
    });
  }

  private async _processOffer(data: ISocketCallRelayPayload): Promise<void> {
    if (!this._peerConnection) return;

    try {
      console.log("[WebRTC] Processing offer — setting remote description");
      await this._webrtc.setRemoteDescription(
        this._peerConnection,
        data.sdp as RTCSessionDescriptionInit,
      );

      this._remoteDescriptionSet = true;
      console.log(
        "[WebRTC] Remote description set (callee), flushing %d ICE candidates",
        this._pendingIceCandidates.length,
      );
      this._flushPendingIceCandidates();

      const answer = await this._webrtc.createAnswer(this._peerConnection);

      console.log("[WebRTC] Sending answer");
      this._socket.emitCallAnswer({
        callId: data.callId,
        targetUserId: data.fromUserId,
        sdp: answer,
      });
    } catch (err) {
      console.error("[WebRTC] Failed to process offer:", err);
    }
  }

  /** Flush queued ICE candidates after remote description is set. */
  private _flushPendingIceCandidates(): void {
    if (!this._peerConnection) return;

    for (const candidate of this._pendingIceCandidates) {
      this._webrtc
        .addIceCandidate(this._peerConnection, candidate)
        .catch(err => {
          console.warn("[WebRTC] Failed to add queued ICE candidate:", err);
        });
    }

    this._pendingIceCandidates = [];
  }

  private _getMyUserId(): string {
    return this._authStore.user?.id ?? "";
  }
}
