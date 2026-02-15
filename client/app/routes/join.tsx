import { type SubmitEvent, useEffect, useState } from 'react';
import { socket } from '~/socket';

export default function Join() {
	const [isConnected, setIsConnected] = useState(socket.connected);
	const [messages, setMessages] = useState<string[]>([]);
	const [messageInput, setMessageInput] = useState('');

	useEffect(() => {
		function onConnect() {
			setIsConnected(true);
		}

		function onDisconnect() {
			setIsConnected(false);
		}

		function onMessageEvent(message: string) {
			console.log(message);
			setMessages((prev) => [...prev, message]);
		}

		socket.on('connect', onConnect);
		socket.on('disconnect', onDisconnect);
		socket.on('message', onMessageEvent);

		return () => {
			socket.off('connect', onConnect);
			socket.off('disconnect', onDisconnect);
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
			<h1 className="text-2xl font-bold">Chat App</h1>
			<section>
				<p>{isConnected ? 'Connected to the server!' : 'Disconnected from the server'}</p>
				<button
					type="button"
					onClick={() => (isConnected ? socket.disconnect() : socket.connect())}
					className="bg-neutral-50 text-neutral-900 rounded p-2"
				>
					{isConnected ? 'Disconnect' : 'Reconnect'}
				</button>
			</section>
			<section>
				<ul>
					{messages.map((message, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: This is static list
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
