export const CHAT_MESSAGE_EVENT = 'chat-message';

export const SET_USER_EVENT = 'set-user';

export function getChatRoomMessageEvent(roomId: string) {
	return `${CHAT_MESSAGE_EVENT}-${roomId}`;
}
