import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '~/../../types';
import { getUser } from '~/lib/user';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:5000';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
	transports: ['websocket', 'polling', 'flashsocket'],
	auth: {
		user: getUser(),
	},
});
