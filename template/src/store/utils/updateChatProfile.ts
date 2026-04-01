import type { ChatDto, PublicProfileDto } from "@api/api-gen/data-contracts";

/**
 * Обновляет профиль пользователя внутри ChatDto (peer или members).
 * Возвращает обновлённый ChatDto или null если профиль не найден.
 */
export function updateChatProfile(
  chat: ChatDto,
  profile: PublicProfileDto,
): ChatDto | null {
  // Обновляем peer (direct-чат)
  if (chat.peer?.userId === profile.userId && chat.peer.profile) {
    return {
      ...chat,
      peer: { ...chat.peer, profile: { ...chat.peer.profile, ...profile } },
    };
  }

  // Обновляем в members (группы/каналы)
  const memberIdx = chat.members.findIndex(
    m => m.profile?.userId === profile.userId,
  );

  if (memberIdx !== -1) {
    const member = chat.members[memberIdx];
    const updatedMembers = [...chat.members];

    updatedMembers[memberIdx] = {
      ...member,
      profile: { ...member.profile!, ...profile },
    };

    return { ...chat, members: updatedMembers };
  }

  return null;
}
