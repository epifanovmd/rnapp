import { CallDto, ECallType } from "@api/api-gen/data-contracts";
import { createServiceDecorator } from "@di";
import { CollectionHolder, EntityHolder, MutationHolder } from "@store/holders";
import { CallModel } from "@store/models";

export const ICallStore = createServiceDecorator<ICallStore>();

export interface ICallStore {
  activeCallHolder: EntityHolder<CallDto>;
  historyHolder: CollectionHolder<CallDto>;
  initiateMutation: MutationHolder<
    { calleeId: string; type: ECallType },
    CallDto
  >;

  activeCall: CallDto | null;
  historyModels: CallModel[];
  isLoading: boolean;

  // State
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  incomingCall: CallDto | null;

  // Actions
  loadHistory(): Promise<void>;
  loadActiveCall(): Promise<void>;
  initiateCall(calleeId: string, type: ECallType): Promise<void>;
  answerCall(callId: string): Promise<void>;
  declineCall(callId: string): Promise<void>;
  endCall(callId: string): Promise<void>;
  toggleMute(): void;
  toggleVideo(): void;

  // Socket handlers
  handleIncomingCall(call: CallDto): void;
  handleCallAnswered(call: CallDto): void;
  handleCallDeclined(call: CallDto): void;
  handleCallEnded(data: CallDto | { callId: string; endedBy: string }): void;
  handleCallMissed(call: CallDto): void;
  handleOffer(data: { callId: string; fromUserId: string; sdp: unknown }): void;
  handleAnswer(data: {
    callId: string;
    fromUserId: string;
    sdp: unknown;
  }): void;
  handleIceCandidate(data: {
    callId: string;
    fromUserId: string;
    candidate: unknown;
  }): void;

  cleanup(): void;
}
