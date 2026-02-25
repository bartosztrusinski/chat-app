import { createServer } from 'node:http';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';
import {
	CHAT_MESSAGE_EVENT,
	getChatRoomJoinEvent,
	getChatRoomLeaveEvent,
	getChatRoomMessageEvent,
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

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: CORS_OPTIONS });

app.use(cors(CORS_OPTIONS));

io.on('connection', (socket) => {
	socket.on(CHAT_MESSAGE_EVENT, ({ body, roomId }: ClientChatMessage) => {
		const { user } = socket.handshake.auth;
		io.emit(getChatRoomMessageEvent(roomId), {
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
		io.emit(getChatRoomJoinEvent(roomId), {
			type: 'system',
			body: `${user.name} has joined the room.`,
		} satisfies ServerChatMessage);
	});

	socket.on(LEAVE_ROOM_EVENT, (roomId: string) => {
		const { user } = socket.handshake.auth;
		io.emit(getChatRoomLeaveEvent(roomId), {
			type: 'system',
			body: `${user.name} has left the room.`,
		} satisfies ServerChatMessage);
	});
});

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
