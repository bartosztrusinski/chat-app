import { createServer } from 'node:http';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';
import {
	CHAT_MESSAGE_EVENT,
	JOIN_ROOM_EVENT,
	LEAVE_ROOM_EVENT,
	SET_USER_EVENT,
} from '../constants';
import type { ClientChatMessage, ServerChatMessage, User } from '../types';

const PORT = process.env.PORT ?? 5000;
const CORS_OPTIONS: cors.CorsOptions = {
	origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
	methods: ['GET', 'POST'],
};
const PENDING_LEAVE_TIMEOUT = 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: CORS_OPTIONS });

const roomUsers = new Map<string, Set<string>>();
const pendingLeaveTimeouts = new Map<string, NodeJS.Timeout>();

function getLeaveKey(roomId: string, userId: string) {
	return `${roomId}:${userId}`;
}

app.use(cors(CORS_OPTIONS));

io.on('connection', (socket) => {
	socket.on(CHAT_MESSAGE_EVENT, ({ body, roomId }: ClientChatMessage) => {
		const { user } = socket.handshake.auth;
		io.to(roomId).emit(CHAT_MESSAGE_EVENT, {
			type: 'chat',
			body,
			user,
		} satisfies ServerChatMessage);
	});

	socket.on(SET_USER_EVENT, (user: User) => {
		socket.handshake.auth.user = user;
	});

	socket.on(JOIN_ROOM_EVENT, (roomId: string) => {
		const { user } = socket.handshake.auth;
		const leaveKey = getLeaveKey(roomId, user.id);
		socket.join(roomId);

		const pendingLeaveTimeout = pendingLeaveTimeouts.get(leaveKey);

		if (pendingLeaveTimeout) {
			clearTimeout(pendingLeaveTimeout);
			pendingLeaveTimeouts.delete(leaveKey);
		}

		const users = roomUsers.get(roomId) ?? new Set();
		const isAbsent = !users.has(user.id);

		if (isAbsent) {
			users.add(user.id);
			roomUsers.set(roomId, users);
			socket.to(roomId).emit(JOIN_ROOM_EVENT, {
				type: 'system',
				body: `${user.name} has joined the room.`,
			} satisfies ServerChatMessage);
		}
	});

	socket.on(LEAVE_ROOM_EVENT, (roomId: string) => {
		const { user } = socket.handshake.auth;
		const leaveKey = getLeaveKey(roomId, user.id);
		socket.leave(roomId);

		const timeoutId = setTimeout(() => {
			const users = roomUsers.get(roomId);

			if (users?.has(user.id)) {
				users.delete(user.id);
				io.to(roomId).emit(LEAVE_ROOM_EVENT, {
					type: 'system',
					body: `${user.name} has left the room.`,
				} satisfies ServerChatMessage);
			}

			if (users?.size === 0) {
				roomUsers.delete(roomId);
			}

			pendingLeaveTimeouts.delete(leaveKey);
		}, PENDING_LEAVE_TIMEOUT);

		pendingLeaveTimeouts.set(leaveKey, timeoutId);
	});
});

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
