import { useEffect } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.SERVER_URL ?? 'http://localhost:5000';

export default function Join() {
	useEffect(() => {
		const _socket = io(SERVER_URL, {
			transports: ['websocket', 'polling', 'flashsocket'],
		});
	}, []);

	return (
		<div>
			<title>Chat App</title>
			<meta
				name="description"
				content="A real-time chat application built with React and Socket.IO."
			/>
			<h1>Join the Chat</h1>
		</div>
	);
}
