import { createServer } from 'node:http';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '../types';

type PendingLeave = {
	timeoutId: NodeJS.Timeout;
	username: string;
};

const PORT = process.env.PORT ?? 5000;
const CORS_OPTIONS: cors.CorsOptions = {
	origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
	methods: ['GET', 'POST'],
};
const PENDING_LEAVE_TIMEOUT = 7000;

const app = express();
const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
	cors: CORS_OPTIONS,
});

const activeRoomUsers = new Map<string, Set<string>>();
const pendingLeaveRequests = new Map<string, PendingLeave>();

function getLeaveKey(roomId: string, userId: string) {
	return `${roomId}:${userId}`;
}

app.use(cors(CORS_OPTIONS));

io.on('connection', (socket) => {
	socket.on('chatMessage', ({ body, roomId }) => {
		const { user } = socket.handshake.auth;
		io.to(roomId).emit('chatMessage', {
			type: 'chat',
			body,
			user,
		});
	});

	socket.on('setUser', (user) => {
		socket.handshake.auth.user = user;
	});

	socket.on('joinRoom', (roomId) => {
		const { user } = socket.handshake.auth;
		const leaveKey = getLeaveKey(roomId, user.id);
		socket.join(roomId);

		const pendingLeave = pendingLeaveRequests.get(leaveKey);

		if (pendingLeave && pendingLeave.username !== user.name) {
			socket.to(roomId).emit('joinRoom', {
				type: 'system',
				body: `${pendingLeave.username} has rejoined the room as ${user.name}.`,
			});
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
			socket.to(roomId).emit('joinRoom', {
				type: 'system',
				body: `${user.name} has joined the room.`,
			});
		}
	});

	socket.on('leaveRoom', (roomId) => {
		const { user } = socket.handshake.auth;
		const leaveKey = getLeaveKey(roomId, user.id);
		socket.leave(roomId);

		const timeoutId = setTimeout(() => {
			const currentRoomUsers = activeRoomUsers.get(roomId);

			if (currentRoomUsers?.has(user.id)) {
				currentRoomUsers.delete(user.id);
				io.to(roomId).emit('leaveRoom', {
					type: 'system',
					body: `${user.name} has left the room.`,
				});
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
