import { io, type Socket } from 'socket.io-client';
import { getUser } from '~/user';
import type { ClientToServerEvents, ServerToClientEvents } from '../../types';

const SERVER_URL = import.meta.env.SERVER_URL ?? 'http://localhost:5000';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
	transports: ['websocket', 'polling', 'flashsocket'],
	auth: {
		user: getUser(),
	},
});
