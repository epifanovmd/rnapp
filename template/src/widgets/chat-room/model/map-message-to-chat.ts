import {
  EMessageStatus,
  EMessageType,
  MessageAttachmentDto,
  MessageDto,
  PollDto,
} from "@shared/api/gen/model";
import { formatFullName, toAbsoluteUrl } from "@shared/lib/utils";
import { type ChatMessage } from "@shared/ui/chat-view";

const mapStatus = (status: string): ChatMessage["status"] => {
  switch (status) {
    case "sending":
      return "sending";
    case EMessageStatus.sent:
      return "sent";
    case EMessageStatus.delivered:
      return "delivered";
    case EMessageStatus.read:
      return "read";
    default:
      return "sent";
  }
};

const findAllAttachmentsByType = (
  attachments: MessageAttachmentDto[],
  prefix: string,
): MessageAttachmentDto[] =>
  attachments.filter(a => a.fileType.startsWith(prefix));

const findFileAttachment = (
  attachments: MessageAttachmentDto[],
): MessageAttachmentDto | undefined =>
  attachments.find(
    a =>
      !a.fileType.startsWith("image/") &&
      !a.fileType.startsWith("video/") &&
      !a.fileType.startsWith("audio/"),
  );

const mapPollToChat = (poll: PollDto) => {
  const totalVotes = poll.totalVotes;

  return {
    id: poll.id,
    question: poll.question,
    options: poll.options.map(o => ({
      id: o.id,
      text: o.text,
      votes: o.voterCount,
      percentage: totalVotes > 0 ? o.voterCount / totalVotes : 0,
    })),
    totalVotes,
    selectedOptionIds:
      poll.userVotedOptionIds?.length > 0 ? poll.userVotedOptionIds : undefined,
    isMultipleChoice: poll.isMultipleChoice,
    isClosed: poll.isClosed,
    isAnonymous: poll.isAnonymous,
  };
};

/** MessageDto extended with optional localId for pending→real mapping. */
type MessageDtoWithLocalId = MessageDto & { localId?: string };

export const mapMessageToChat = (
  msg: MessageDtoWithLocalId,
  currentUserId?: string,
): ChatMessage => {
  const ownership: ChatMessage["ownership"] =
    msg.type === EMessageType.system
      ? "system"
      : msg.senderId === currentUserId
        ? "mine"
        : "theirs";

  const imageAttachments = findAllAttachmentsByType(msg.attachments, "image/");
  const videoAttachment = findAllAttachmentsByType(
    msg.attachments,
    "video/",
  )[0];
  const voiceAttachment = findAllAttachmentsByType(
    msg.attachments,
    "audio/",
  )[0];
  const fileAttachment = findFileAttachment(msg.attachments);

  return {
    id: msg.id,
    localId: msg.localId,
    text: msg.content ?? undefined,
    timestamp: new Date(msg.createdAt).getTime(),
    ownership,
    senderName:
      ownership === "mine"
        ? undefined
        : msg.sender
          ? formatFullName(msg.sender.firstName, msg.sender.lastName)
          : undefined,
    senderAvatarUrl:
      ownership === "mine" ? undefined : (msg.sender?.avatarUrl ?? undefined),
    status: mapStatus(msg.status),
    isEdited: msg.isEdited,
    forwardedFrom: msg.forwardedFromId
      ? msg.sender
        ? formatFullName(msg.sender.firstName, msg.sender.lastName)
        : "Forwarded"
      : undefined,

    images:
      imageAttachments.length > 0
        ? imageAttachments.map(a => ({
            url: toAbsoluteUrl(a.fileUrl) ?? a.fileUrl,
            width: a.width ?? undefined,
            height: a.height ?? undefined,
            thumbnailUrl: toAbsoluteUrl(a.thumbnailUrl ?? undefined),
          }))
        : undefined,

    video: videoAttachment
      ? {
          url:
            toAbsoluteUrl(videoAttachment.fileUrl) ?? videoAttachment.fileUrl,
          thumbnailUrl: toAbsoluteUrl(
            videoAttachment.thumbnailUrl ?? undefined,
          ),
          width: videoAttachment.width ?? undefined,
          height: videoAttachment.height ?? undefined,
          duration: videoAttachment.duration ?? undefined,
        }
      : undefined,

    voice: voiceAttachment
      ? {
          url:
            toAbsoluteUrl(voiceAttachment.fileUrl) ?? voiceAttachment.fileUrl,
          duration: voiceAttachment.duration ?? 0,
          waveform: voiceAttachment.waveform ?? undefined,
        }
      : undefined,

    poll: msg.poll ? mapPollToChat(msg.poll) : undefined,

    file: fileAttachment
      ? {
          url: toAbsoluteUrl(fileAttachment.fileUrl) ?? fileAttachment.fileUrl,
          name: fileAttachment.fileName,
          size: fileAttachment.fileSize,
          mimeType: fileAttachment.fileType,
        }
      : undefined,

    reactions:
      msg.reactions.length > 0
        ? msg.reactions.map(r => ({
            emoji: r.emoji,
            count: r.count,
            isSelected: r.userIds.includes(currentUserId ?? ""),
          }))
        : undefined,

    replyTo: msg.replyTo
      ? {
          id: msg.replyTo.id,
          text: msg.replyTo.content ?? undefined,
          senderName:
            msg.replyTo.senderId === currentUserId
              ? "You"
              : msg.replyTo.sender
                ? formatFullName(
                    msg.replyTo.sender.firstName,
                    msg.replyTo.sender.lastName,
                  )
                : undefined,
          hasImages: msg.replyTo.attachments.some(a =>
            a.fileType.startsWith("image/"),
          ),
        }
      : undefined,
  };
};
