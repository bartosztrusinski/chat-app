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
import type { ClientChatMessage, PendingLeave, ServerChatMessage, User } from '../types';

const PORT = process.env.PORT ?? 5000;
const CORS_OPTIONS: cors.CorsOptions = {
	origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
	methods: ['GET', 'POST'],
};
const PENDING_LEAVE_TIMEOUT = 7000;

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: CORS_OPTIONS });

const activeRoomUsers = new Map<string, Set<string>>();
const pendingLeaveRequests = new Map<string, PendingLeave>();

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

		const pendingLeave = pendingLeaveRequests.get(leaveKey);

		if (pendingLeave && pendingLeave.username !== user.name) {
			socket.to(roomId).emit(JOIN_ROOM_EVENT, {
				type: 'system',
				body: `${pendingLeave.username} has rejoined the room as ${user.name}.`,
			} satisfies ServerChatMessage);
		}

		if (pendingLeave) {
			clearTimeout(pendingLeave.timeoutId);
			pendingLeaveRequests.delete(leaveKey);
		}

		const currentRoomUsers = activeRoomUsers.get(roomId) ?? new Set();
		const isAbsent = !currentRoomUsers.has(user.id);

		if (isAbsent) {
			currentRoomUsers.add(user.id);
			activeRoomUsers.set(roomId, currentRoomUsers);
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
			const currentRoomUsers = activeRoomUsers.get(roomId);

			if (currentRoomUsers?.has(user.id)) {
				currentRoomUsers.delete(user.id);
				io.to(roomId).emit(LEAVE_ROOM_EVENT, {
					type: 'system',
					body: `${user.name} has left the room.`,
				} satisfies ServerChatMessage);
			}

			if (currentRoomUsers?.size === 0) {
				activeRoomUsers.delete(roomId);
			}

			pendingLeaveRequests.delete(leaveKey);
		}, PENDING_LEAVE_TIMEOUT);

		pendingLeaveRequests.set(leaveKey, { timeoutId, username: user.name });
	});
});

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
