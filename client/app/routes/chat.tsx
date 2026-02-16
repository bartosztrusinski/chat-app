import { type SubmitEvent, useEffect, useState } from 'react';
import { socket } from '~/socket';

export default function Chat() {
	const [messages, setMessages] = useState<string[]>([]);
	const [messageInput, setMessageInput] = useState('');

	useEffect(() => {
		function onMessageEvent(message: string) {
			console.log(message);
			setMessages((prev) => [...prev, message]);
		}

		socket.on('message', onMessageEvent);

		return () => {
			socket.off('message', onMessageEvent);
		};
	}, []);

	function onSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!messageInput.trim()) return;
		socket.timeout(2000).emit('message', messageInput);
		setMessageInput('');
	}

	return (
		<div className="space-y-8 p-4">
			<title>Chat App</title>
			<meta
				name="description"
				content="A real-time chat application built with React and Socket.IO."
			/>
			<h1 className="text-2xl font-bold">Chat Room</h1>
			<section>
				<ul>
					{messages.map((message, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: order doesn't change and messages are immutable
						<li key={index}>{message}</li>
					))}
				</ul>
			</section>
			<section>
				<form className="space-x-2" onSubmit={onSubmit}>
					<input
						type="text"
						placeholder="Type a message..."
						className="border rounded p-2 "
						value={messageInput}
						onChange={(event) => setMessageInput(event.target.value)}
					/>
					<button type="submit" className="bg-neutral-50 text-neutral-900 rounded p-2">
						Send
					</button>
				</form>
			</section>
		</div>
	);
}
