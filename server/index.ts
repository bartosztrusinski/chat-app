import { createServer } from 'node:http';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';
import { CHAT_MESSAGE_EVENT, getChatRoomMessageEvent } from '../constants';
import type { ClientChatMessage, ServerChatMessage } from '../types';

const PORT = process.env.PORT ?? 5000;
const CORS_OPTIONS: cors.CorsOptions = {
	origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
	methods: ['GET', 'POST'],
};

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: CORS_OPTIONS });

app.use(cors(CORS_OPTIONS));

app.get('/', (_, res) => {
	res.send('Hello from the server');
});

io.on('connection', (socket) => {
	console.log('A user connected');
	socket.on('disconnect', () => {
		console.log('A user disconnected');
	});

	socket.on(CHAT_MESSAGE_EVENT, ({ body, roomId }: ClientChatMessage) => {
		const { userId } = socket.handshake.auth;
		io.emit(getChatRoomMessageEvent(roomId), {
			body,
			userId,
		} satisfies ServerChatMessage);
	});
});

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
