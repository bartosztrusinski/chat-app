export const CHAT_MESSAGE_EVENT = 'chat-message';

export const SET_USER_EVENT = 'set-user';

export const JOIN_ROOM_EVENT = 'join-room';

export const LEAVE_ROOM_EVENT = 'leave-room';

export function getChatRoomMessageEvent(roomId: string) {
	return `${CHAT_MESSAGE_EVENT}-${roomId}`;
}

export function getChatRoomJoinEvent(roomId: string) {
	return `${JOIN_ROOM_EVENT}-${roomId}`;
}

export function getChatRoomLeaveEvent(roomId: string) {
	return `${LEAVE_ROOM_EVENT}-${roomId}`;
}
