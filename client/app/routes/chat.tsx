import { ArrowDown, ArrowUp } from 'lucide-react';
import {
	lazy,
	type SubmitEvent,
	Suspense,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { redirect } from 'react-router';
import type { ClientToServerEvents, ServerToClientChatMessage } from '~/../../types';
import { socket } from '~/socket';
import { useIsTouchDevice } from '~/use-is-touch-device';
import { useOnScreenKeyboardScrollFix } from '~/use-on-screen-keyboard-scroll-fix';
import { useViewportSize } from '~/use-viewport-size';
import { getUser } from '~/user';
import type { Route } from './+types/chat';

const EmojiPicker = lazy(() =>
	import('~/components/emoji-picker').then((module) => ({
		default: module.EmojiPicker,
	})),
);

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const { roomId } = params;
	const currentUser = getUser();

	if (!currentUser) {
		const searchParams = new URLSearchParams({ room: roomId });
		return redirect(`/?${searchParams}`);
	}

	return { currentUser };
}

export default function Chat({ params, loaderData }: Route.ComponentProps) {
	const viewportSize = useViewportSize();
	const isTouchDevice = useIsTouchDevice();
	const [inputValue, setInputValue] = useState('');
	const [chatMessages, setChatMessages] = useState<ServerToClientChatMessage[]>([]);
	const [unreadMessages, setUnreadMessages] = useState<number | null>(null);
	const chatBottom = useRef<HTMLDivElement>(null);
	const chatContainer = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const formRef = useRef<HTMLFormElement>(null);
	const shouldPinOnKeyboardResize = useRef(false);
	const { roomId } = params;
	const { currentUser } = loaderData;
	const isAtBottom = unreadMessages === null;
	const hasMessage = inputValue.trim().length > 0;

	useOnScreenKeyboardScrollFix();

	const scrollChatToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
		chatContainer.current?.scrollTo({
			top: chatContainer.current.scrollHeight,
			behavior,
		});
	}, []);

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
			scrollChatToBottom('smooth');
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

	// When the on-screen keyboard appears, we want to keep the chat scrolled to the bottom if the user was already at the bottom before the keyboard appeared. We use a ref to track whether we should pin to the bottom on keyboard resize, and we check for that in a useEffect that runs when the viewport size changes which happens when the keyboard appears.
	useEffect(() => {
		if (!isTouchDevice || !viewportSize || !shouldPinOnKeyboardResize.current) {
			return;
		}

		if (document.activeElement !== textareaRef.current) {
			shouldPinOnKeyboardResize.current = false;
			return;
		}

		requestAnimationFrame(() => scrollChatToBottom('auto'));
		shouldPinOnKeyboardResize.current = false;
	}, [isTouchDevice, scrollChatToBottom, viewportSize]);

	function sendChatRoomMessage(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (inputValue.trim().length > 0) {
			socket.timeout(2000).emit('chatMessage', {
				roomId,
				body: inputValue,
			});
			setInputValue('');
			requestAnimationFrame(() => textareaRef.current?.focus({ preventScroll: true }));
		}
	}

	return (
		<main
			className="h-full max-w-2xl mx-auto flex flex-col bg-neutral-900 border border-neutral-800"
			style={{ height: viewportSize?.[1] }}
		>
			<title>{roomId} room | Chat App</title>
			<meta
				name="description"
				content={`${roomId} chat room. A real-time chat application built with React and Socket.IO. Join the conversation and chat with others in real-time!`}
			/>

			<section
				ref={chatContainer}
				className="relative grow shrink overflow-y-auto overscroll-contain"
			>
				<header className="sticky top-0 z-10 border-b border-neutral-800/80 bg-neutral-900/70 backdrop-blur-md">
					<h1 className="text-2xl font-bold p-2 px-3">{roomId}</h1>
				</header>
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
									<p className="text-sm text-neutral-400 italic">{message.body}</p>
								) : (
									<>
										{showUsername && (
											<p className="text-sm text-neutral-400 px-1">{message.user.name}</p>
										)}
										<p
											className={`py-2 px-3 rounded-xl max-w-2/3 w-fit wrap-break-word text-pretty ${message.user.id === currentUser.id ? 'bg-blue-600' : 'bg-neutral-700'}`}
										>
											{message.body}
										</p>
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
						className="sticky flex items-center justify-center size-10 bg-neutral-600 rounded-full bottom-3 left-1/2 -translate-x-1/2 shadow-md cursor-pointer"
						onClick={() => scrollChatToBottom('smooth')}
						onPointerDown={(event) => event.preventDefault()}
					>
						<ArrowDown size={18} />
						<span className="sr-only">Scroll to bottom</span>
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
			<footer className="p-2 overflow-hidden border-t border-neutral-800 flex items-center gap-2 shrink-0 bg-neutral-900">
				{isTouchDevice === false && (
					<Suspense
						fallback={
							<div className="text-2xl size-10 flex gap-0 justify-center items-center">
								🙂
							</div>
						}
					>
						<EmojiPicker
							onEmojiClick={({ emoji }) => setInputValue((prev) => prev + emoji)}
							onCloseAutoFocus={() => textareaRef.current?.focus()}
						/>
					</Suspense>
				)}
				<form
					ref={formRef}
					className={`grow ${isTouchDevice ? 'grid transition-[grid-template-columns] ease-out items-center' : ''} ${isTouchDevice ? (hasMessage ? 'grid-cols-[1fr_2.5rem] gap-2' : 'grid-cols-[1fr_0] gap-0') : ''}`}
					onSubmit={sendChatRoomMessage}
				>
					<textarea
						ref={textareaRef}
						aria-label="Message"
						placeholder="Message"
						maxLength={128}
						rows={1}
						className="block rounded-2xl w-full px-4 py-2 bg-neutral-700 field-sizing-content resize-none text-wrap wrap-anywhere overflow-x-hidden focus-visible:outline-2 focus-visible:outline-neutral-50"
						value={inputValue}
						onChange={(event) => setInputValue(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault();
								formRef.current?.requestSubmit();
							}
						}}
						onFocus={() => {
							shouldPinOnKeyboardResize.current = isTouchDevice === true && isAtBottom;
						}}
						onBlur={() => {
							shouldPinOnKeyboardResize.current = false;
						}}
					/>
					{isTouchDevice && (
						<button
							type="submit"
							disabled={!hasMessage}
							tabIndex={hasMessage ? 0 : -1}
							aria-hidden={!hasMessage}
							onPointerDown={(event) => event.preventDefault()}
							className={`size-10 flex justify-center items-center rounded-full bg-blue-600 transition-all ease-out ${hasMessage ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}
						>
							<ArrowUp size={18} />
							<span className="sr-only">Send message</span>
						</button>
					)}
				</form>
			</footer>
		</main>
	);
}
