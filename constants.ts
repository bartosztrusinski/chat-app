export const CHAT_MESSAGE_EVENT = 'chat-message';

export const SET_USERNAME_EVENT = 'set-username';

export function getChatRoomMessageEvent(roomId: string) {
	return `${CHAT_MESSAGE_EVENT}-${roomId}`;
}
