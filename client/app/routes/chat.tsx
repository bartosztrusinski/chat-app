import { type SubmitEvent, useEffect, useState } from 'react';
import { socket } from '~/socket';
import type { Route } from '../+types/root';

type ChatMessage = {
	roomId: string;
	message: string;
};

const CHAT_MESSAGE_EVENT = 'chat-message';

export default function Chat({ params }: Route.ComponentProps) {
	const { roomId } = params;
	const [chatMessages, setChatMessages] = useState<string[]>([]);
	const [inputValue, setInputValue] = useState('');

	if (!roomId) {
		throw new Error('Room ID is required');
	}

	useEffect(() => {
		const CHAT_ROOM_MESSAGE_EVENT = `${roomId}-${CHAT_MESSAGE_EVENT}`;

		function onChatRoomMessageEvent(message: string) {
			setChatMessages((prev) => [...prev, message]);
		}

		socket.on(CHAT_ROOM_MESSAGE_EVENT, onChatRoomMessageEvent);

		return () => {
			socket.off(CHAT_ROOM_MESSAGE_EVENT, onChatRoomMessageEvent);
		};
	}, [roomId]);

	function sendChatRoomMessage(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (inputValue.trim().length > 0 && roomId) {
			socket.timeout(2000).emit(CHAT_MESSAGE_EVENT, {
				roomId,
				message: inputValue,
			} satisfies ChatMessage);
			setInputValue('');
		}
	}

	return (
		<div className="space-y-8 p-4">
			<title>Chat App</title>
			<meta
				name="description"
				content="A real-time chat application built with React and Socket.IO."
			/>
			<h1 className="text-2xl font-bold">Chat Room {roomId}</h1>
			<section>
				<ul>
					{chatMessages.map((message, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: order doesn't change and messages are immutable
						<li key={index}>{message}</li>
					))}
				</ul>
			</section>
			<section>
				<form className="space-x-2" onSubmit={sendChatRoomMessage}>
					<input
						type="text"
						placeholder="Type a message..."
						className="border rounded p-2 "
						value={inputValue}
						onChange={(event) => setInputValue(event.target.value)}
					/>
					<button type="submit" className="bg-neutral-50 text-neutral-900 rounded p-2">
						Send
					</button>
				</form>
			</section>
		</div>
	);
}
