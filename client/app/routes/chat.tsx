import { type SubmitEvent, useEffect, useRef, useState } from 'react';
import { redirect } from 'react-router';
import { CHAT_MESSAGE_EVENT, JOIN_ROOM_EVENT, LEAVE_ROOM_EVENT } from '~/../../constants';
import type { ClientChatMessage, ServerChatMessage } from '~/../../types';
import { socket } from '~/socket';
import { getUser } from '~/user';
import type { Route } from './+types/chat';

export async function clientLoader() {
	const currentUser = getUser();

	if (!currentUser) {
		return redirect('/');
	}

	return { currentUser };
}

export default function Chat({ params, loaderData }: Route.ComponentProps) {
	const { roomId } = params;
	const { currentUser } = loaderData;
	const [chatMessages, setChatMessages] = useState<ServerChatMessage[]>([]);
	const [inputValue, setInputValue] = useState('');
	const chatBottom = useRef<HTMLDivElement>(null);
	const chatContainer = useRef<HTMLDivElement>(null);
	const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				setShouldAutoScroll(entry.isIntersecting);
			},
			{
				root: chatContainer.current,
				rootMargin: '100px',
			},
		);

		if (chatBottom.current) {
			observer.observe(chatBottom.current);
		}

		return () => {
			if (chatBottom.current) {
				observer.unobserve(chatBottom.current);
			}
		};
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: trigger effect when messages change to scroll to bottom
	useEffect(() => {
		if (shouldAutoScroll) {
			chatBottom.current?.scrollIntoView({ behavior: 'smooth' });
		}
	}, [chatMessages]);

	useEffect(() => {
		const eventKeys = [CHAT_MESSAGE_EVENT, JOIN_ROOM_EVENT, LEAVE_ROOM_EVENT] as const;

		function onRoomEvent(message: ServerChatMessage) {
			setChatMessages((prev) => [...prev, message]);
		}

		socket.emit(JOIN_ROOM_EVENT, roomId);
		eventKeys.forEach((event) => {
			socket.on(event, onRoomEvent);
		});

		return () => {
			socket.emit(LEAVE_ROOM_EVENT, roomId);
			eventKeys.forEach((event) => {
				socket.off(event, onRoomEvent);
			});
		};
	}, [roomId]);

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
			<section ref={chatContainer} className="grow overflow-y-auto p-3">
				<ul className="gap-3 flex flex-col">
					{chatMessages.map((message, index) => {
						const previousMessage = index > 0 ? chatMessages[index - 1] : null;
						const showUsername =
							(message.type === 'chat' &&
								previousMessage?.type === 'chat' &&
								(previousMessage.user.id !== message.user.id ||
									previousMessage.user.name !== message.user.name)) ||
							index === 0 ||
							previousMessage?.type === 'system';

						return (
							<li
								// biome-ignore lint/suspicious/noArrayIndexKey: order doesn't change and messages are immutable
								key={index}
								className={`flex flex-col gap-1 ${message.type === 'system' ? 'items-center' : message.user.id === currentUser.id ? 'items-end' : 'justify-start'}`}
							>
								{message.type === 'system' ? (
									<div className="text-sm text-neutral-400 italic">{message.body}</div>
								) : (
									<>
										{showUsername && (
											<div className="text-sm text-neutral-400 px-1">
												{message.user.name}
											</div>
										)}
										<div
											className={`py-2 px-3 rounded-xl max-w-2/3 w-fit wrap-break-word text-pretty ${message.user.id === currentUser.id ? 'bg-blue-600' : 'bg-neutral-700'}`}
										>
											{message.body}
										</div>
									</>
								)}
							</li>
						);
					})}
				</ul>
				<div ref={chatBottom}></div>
				{!shouldAutoScroll && (
					<button
						type="button"
						className="fixed size-10 bg-neutral-600 text-sm rounded-full bottom-20 left-1/2 -translate-x-1/2 shadow-md cursor-pointer"
						onClick={() => chatBottom.current?.scrollIntoView({ behavior: 'smooth' })}
					>
						🡣
					</button>
				)}
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
