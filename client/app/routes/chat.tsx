import { type SubmitEvent, useEffect, useState } from 'react';
import { CHAT_MESSAGE_EVENT, getChatRoomMessageEvent } from '~/../../constants';
import type { ClientChatMessage, ServerChatMessage } from '~/../../types';
import { getUserId } from '~/get-user-id';
import { socket } from '~/socket';
import type { Route } from '../+types/root';

const userId = getUserId();

export default function Chat({ params }: Route.ComponentProps) {
	const { roomId } = params;
	const [chatMessages, setChatMessages] = useState<ServerChatMessage[]>([]);
	const [inputValue, setInputValue] = useState('');

	if (!roomId) {
		throw new Error('Room ID is required');
	}

	useEffect(() => {
		function onChatRoomMessageEvent(message: ServerChatMessage) {
			setChatMessages((prev) => [...prev, message]);
		}

		socket.on(getChatRoomMessageEvent(roomId), onChatRoomMessageEvent);

		return () => {
			socket.off(getChatRoomMessageEvent(roomId), onChatRoomMessageEvent);
		};
	}, [roomId]);

	function sendChatRoomMessage(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (inputValue.trim().length > 0 && roomId) {
			socket.timeout(2000).emit(CHAT_MESSAGE_EVENT, {
				roomId,
				body: inputValue,
			} satisfies ClientChatMessage);
			setInputValue('');
		}
	}

	return (
		<div className="max-w-md h-dvh mx-auto flex flex-col bg-neutral-900 border border-neutral-800">
			<title>Chat App</title>
			<meta
				name="description"
				content="A real-time chat application built with React and Socket.IO."
			/>
			<h1 className="text-2xl font-bold p-3 border-b border-neutral-800">{roomId}</h1>
			<section className="grow overflow-y-auto p-3">
				<ul className="gap-2 flex flex-col items-start">
					{chatMessages.map(({ body, userId: senderId }, index) => (
						<li
							// biome-ignore lint/suspicious/noArrayIndexKey: order doesn't change and messages are immutable
							key={index}
							className={`py-2 px-3 rounded-xl max-w-3/5 text-pretty ${senderId === userId ? 'bg-blue-600 self-end' : 'bg-neutral-700'}`}
						>
							{body}
						</li>
					))}
				</ul>
			</section>
			<section className="p-3 border-t border-neutral-800">
				<form className="space-x-2" onSubmit={sendChatRoomMessage}>
					<input
						type="text"
						placeholder="Message"
						className="rounded-2xl w-full px-4 py-2 bg-neutral-700"
						value={inputValue}
						onChange={(event) => setInputValue(event.target.value)}
					/>
				</form>
			</section>
		</div>
	);
}
