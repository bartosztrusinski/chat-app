import { io } from 'socket.io-client';
import { getUserId } from '~/get-user-id';

const SERVER_URL = import.meta.env.SERVER_URL ?? 'http://localhost:5000';

export const socket = io(SERVER_URL, {
	transports: ['websocket', 'polling', 'flashsocket'],
	auth: {
		userId: getUserId(),
	},
});
