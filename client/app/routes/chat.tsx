import { type SubmitEvent, useEffect, useRef, useState } from 'react';
import { redirect } from 'react-router';
import { CHAT_MESSAGE_EVENT, getChatRoomMessageEvent } from '~/../../constants';
import type { ClientChatMessage, ServerChatMessage } from '~/../../types';
import { socket } from '~/socket';
import { getUser } from '~/user';
import type { Route } from './+types/chat';

export async function clientLoader() {
	const user = getUser();

	if (!user) {
		return redirect('/');
	}

	return { user };
}

export default function Chat({ params, loaderData }: Route.ComponentProps) {
	const { roomId } = params;
	const { user } = loaderData;
	const [chatMessages, setChatMessages] = useState<ServerChatMessage[]>([]);
	const [inputValue, setInputValue] = useState('');
	const chatBottom = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function onChatRoomMessageEvent(message: ServerChatMessage) {
			setChatMessages((prev) => [...prev, message]);
		}

		socket.on(getChatRoomMessageEvent(roomId), onChatRoomMessageEvent);

		return () => {
			socket.off(getChatRoomMessageEvent(roomId), onChatRoomMessageEvent);
		};
	}, [roomId]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: trigger effect when messages change to scroll to bottom
	useEffect(() => {
		chatBottom.current?.scrollIntoView({ behavior: 'smooth' });
	}, [chatMessages]);

	function sendChatRoomMessage(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (inputValue.trim().length > 0) {
			socket.timeout(2000).emit(CHAT_MESSAGE_EVENT, {
				roomId,
				body: inputValue,
			} satisfies ClientChatMessage);
			setInputValue('');
		}
	}

	return (
		<div className="max-w-lg h-dvh mx-auto flex flex-col bg-neutral-900 border border-neutral-800">
			<title>Chat App</title>
			<meta
				name="description"
				content="A real-time chat application built with React and Socket.IO."
			/>
			<h1 className="text-2xl font-bold p-3 border-b border-neutral-800">{roomId}</h1>
			<section className="grow overflow-y-auto p-3">
				<ul className="gap-3 flex flex-col">
					{chatMessages.map(({ body, user: sender }, index) => (
						<li
							// biome-ignore lint/suspicious/noArrayIndexKey: order doesn't change and messages are immutable
							key={index}
							className={`flex items-center gap-1 ${sender.id === user?.id ? 'justify-end' : 'flex-row-reverse justify-end'}`}
						>
							<div className="text-sm text-neutral-400">{sender.name}</div>
							<div
								className={`py-2 px-3 rounded-xl max-w-2/3 w-fit wrap-break-word text-pretty ${sender.id === user?.id ? 'bg-blue-600' : 'bg-neutral-700'}`}
							>
								{body}
							</div>
						</li>
					))}
				</ul>
				<div ref={chatBottom}></div>
			</section>
			<section className="p-3 border-t border-neutral-800">
				<form className="space-x-2" onSubmit={sendChatRoomMessage}>
					<input
						type="text"
						placeholder="Message"
						// biome-ignore lint/a11y/noAutofocus: full page chat app
						autoFocus
						className="rounded-2xl w-full px-4 py-2 bg-neutral-700"
						value={inputValue}
						onChange={(event) => setInputValue(event.target.value)}
					/>
				</form>
			</section>
		</div>
	);
}
