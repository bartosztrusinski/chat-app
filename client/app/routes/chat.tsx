import { type SubmitEvent, useEffect, useRef, useState } from 'react';
import { redirect } from 'react-router';
import type { ClientToServerEvents, ServerToClientChatMessage } from '~/../../types';
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
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const formRef = useRef<HTMLFormElement>(null);
	const [inputValue, setInputValue] = useState('');
	const [chatMessages, setChatMessages] = useState<ServerToClientChatMessage[]>([]);
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
				rootMargin: '240px',
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: other dependencies change when chatMessages do, and cause unwanted behavior if added to the dependency array
	useEffect(() => {
		const lastMessage = chatMessages.at(-1);
		const isLastMessageFromCurrentUser =
			lastMessage?.type === 'chat' && lastMessage.user.id === currentUser.id;

		if (isAtBottom || (unreadMessages > 0 && isLastMessageFromCurrentUser)) {
			chatBottom.current?.scrollIntoView({ behavior: 'smooth' });
		}
	}, [chatMessages, currentUser.id]);

	useEffect(() => {
		const eventKeys = [
			'chatMessage',
			'joinRoom',
			'leaveRoom',
		] satisfies (keyof ClientToServerEvents)[];

		function onRoomEvent(message: ServerToClientChatMessage) {
			setUnreadMessages((prev) => (prev === null ? prev : prev + 1));
			setChatMessages((prev) => [...prev, message]);
		}

		socket.emit('joinRoom', roomId);
		eventKeys.forEach((eventKey) => {
			socket.on(eventKey, onRoomEvent);
		});

		return () => {
			socket.emit('leaveRoom', roomId);
			eventKeys.forEach((eventKey) => {
				socket.off(eventKey, onRoomEvent);
			});
		};
	}, [roomId]);

	function sendChatRoomMessage(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (inputValue.trim().length > 0) {
			socket.timeout(2000).emit('chatMessage', {
				roomId,
				body: inputValue,
			});
			setInputValue('');
		}
	}

	return (
		<main className="max-w-lg h-dvh mx-auto flex flex-col bg-neutral-900 border border-neutral-800">
			<title>{roomId} room | Chat App</title>
			<meta
				name="description"
				content={`${roomId} chat room. A real-time chat application built with React and Socket.IO. Join the conversation and chat with others in real-time!`}
			/>
			<section ref={chatContainer} className="relative grow overflow-y-auto">
				<h1 className="text-2xl font-bold p-2 px-3 border-b border-neutral-800/80 bg-neutral-900/70 backdrop-blur-md sticky top-0 z-10">
					{roomId}
				</h1>
				<ul
					className="gap-3 flex flex-col p-3"
					role="log"
					aria-live="polite"
					aria-relevant="additions text"
					aria-label={`Messages in room ${roomId}`}
				>
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
						className="sticky size-10 bg-neutral-600 text-sm rounded-full bottom-3 left-1/2 -translate-x-1/2 shadow-md cursor-pointer"
						onClick={() => chatBottom.current?.scrollIntoView({ behavior: 'smooth' })}
					>
						🡣<span className="sr-only">Scroll to bottom</span>
						{unreadMessages > 0 && (
							<span
								className={`absolute -bottom-1 text-xs px-1 min-w-4 py-0.5 flex place-content-center place-items-center rounded-full bg-blue-500 ${unreadMessages > 99 ? '-right-3' : '-right-1'}`}
							>
								{unreadMessages > 99 ? '99+' : unreadMessages}
							</span>
						)}
					</button>
				)}
			</section>
			<section className="p-2 border-t border-neutral-800 flex items-center gap-2">
				<EmojiPicker
					onEmojiClick={({ emoji }) => setInputValue((prev) => prev + emoji)}
					onCloseAutoFocus={() => textareaRef.current?.focus()}
				/>
				<form ref={formRef} className="grow" onSubmit={sendChatRoomMessage}>
					<textarea
						ref={textareaRef}
						aria-label="Message"
						placeholder="Message"
						maxLength={128}
						rows={1}
						// biome-ignore lint/a11y/noAutofocus: full page chat app
						autoFocus
						className="block rounded-2xl w-full px-4 py-2 bg-neutral-700 field-sizing-content resize-none text-wrap wrap-anywhere overflow-x-hidden"
						value={inputValue}
						onChange={(event) => setInputValue(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault();
								formRef.current?.requestSubmit();
							}
						}}
					/>
				</form>
			</section>
		</main>
	);
}
