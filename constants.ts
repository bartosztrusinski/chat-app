export const CHAT_MESSAGE_EVENT = 'chat-message';

export function getChatRoomMessageEvent(roomId: string) {
	return `${CHAT_MESSAGE_EVENT}-${roomId}`;
}
