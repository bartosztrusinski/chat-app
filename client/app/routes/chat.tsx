import { type SubmitEvent, useEffect, useRef, useState } from 'react';
import { redirect } from 'react-router';
import { CHAT_MESSAGE_EVENT, JOIN_ROOM_EVENT, LEAVE_ROOM_EVENT } from '~/../../constants';
import type { ClientChatMessage, ServerChatMessage } from '~/../../types';
import { EmojiPicker } from '~/components/emoji-picker';
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
	const chatBottom = useRef<HTMLDivElement>(null);
	const chatContainer = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [inputValue, setInputValue] = useState('');
	const [chatMessages, setChatMessages] = useState<ServerChatMessage[]>([]);
	const [unreadMessages, setUnreadMessages] = useState<number | null>(null);
	const isAtBottom = unreadMessages === null;

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) =>
				setUnreadMessages((prev) =>
					entry.isIntersecting ? null : prev === null ? 0 : prev,
				),
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

	useEffect(() => {
		const lastMessage = chatMessages.at(-1);
		const isLastMessageFromCurrentUser =
			lastMessage?.type === 'chat' && lastMessage.user.id === currentUser.id;
		if (isAtBottom || (unreadMessages > 0 && isLastMessageFromCurrentUser)) {
			chatBottom.current?.scrollIntoView({ behavior: 'smooth' });
		}
	}, [chatMessages, currentUser.id, isAtBottom, unreadMessages]);

	useEffect(() => {
		const eventKeys = [CHAT_MESSAGE_EVENT, JOIN_ROOM_EVENT, LEAVE_ROOM_EVENT] as const;

		function onRoomEvent(message: ServerChatMessage) {
			setUnreadMessages((prev) => (prev === null ? prev : prev + 1));
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
			<h1 className="text-2xl font-bold p-2 px-3 border-b border-neutral-800">
				{roomId}
			</h1>
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
				{!isAtBottom && (
					<button
						type="button"
						className="fixed size-10 bg-neutral-600 text-sm rounded-full bottom-20 left-1/2 -translate-x-1/2 shadow-md cursor-pointer"
						onClick={() => chatBottom.current?.scrollIntoView({ behavior: 'smooth' })}
					>
						🡣<span className="sr-only">Scroll to bottom</span>
						{unreadMessages > 0 && (
							<span
								className={`absolute -bottom-1 text-xs px-1 min-w-4 py-0.5 flex place-content-center place-items-center rounded-full bg-blue-600 ${unreadMessages > 99 ? '-right-3' : '-right-1'}`}
							>
								{unreadMessages > 99 ? '99+' : unreadMessages}
							</span>
						)}
					</button>
				)}
			</section>
			<section className="p-2 border-t border-neutral-800 flex gap-2">
				<EmojiPicker
					onEmojiClick={({ emoji }) => setInputValue((prev) => prev + emoji)}
					onCloseAutoFocus={() => inputRef.current?.focus()}
				/>
				<form className="grow" onSubmit={sendChatRoomMessage}>
					<input
						ref={inputRef}
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
