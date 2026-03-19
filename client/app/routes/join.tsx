import { type SubmitEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { socket } from '~/socket';
import { getUser, updateUser } from '~/user';

export default function Join() {
	const user = getUser();
	const navigate = useNavigate();
	const [isConnected, setIsConnected] = useState(socket.connected);
	const [roomId, setRoomId] = useState('');
	const [username, setUsername] = useState(user?.name ?? '');

	useEffect(() => {
		function onConnect() {
			setIsConnected(true);
		}

		function onDisconnect() {
			setIsConnected(false);
		}

		socket.on('connect', onConnect);
		socket.on('disconnect', onDisconnect);

		return () => {
			socket.off('connect', onConnect);
			socket.off('disconnect', onDisconnect);
		};
	}, []);

	function joinChatRoom(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		if ((user && user.name !== username.trim()) || !user) {
			updateUser(username);
		}

		if (roomId.trim().length > 0) {
			navigate(`/chat/${roomId}`);
		}
	}

	return (
		<main className="py-10 w-72 mx-auto h-full flex flex-col">
			<div>
				<title>Chat App</title>
				<meta
					name="description"
					content="A real-time chat application built with React and Socket.IO. Join the conversation and chat with others in real-time!"
				/>
				<h1 className="text-4xl font-black text-center">Chat App</h1>
				<p className="text-center mt-2 text-balance text-neutral-400">
					Join a chat room and start chatting with others in real-time!
				</p>
				<p
					id="connection-status"
					aria-live="polite"
					aria-atomic="true"
					className="text-center mt-4 text-sm text-neutral-300"
				>
					{isConnected ? 'Connected' : 'Disconnected. Reconnecting...'}
				</p>
				<form className="space-y-4 mt-12" onSubmit={joinChatRoom}>
					<div>
						<label htmlFor="room-id" className="ml-2">
							Room ID
						</label>
						<input
							id="room-id"
							type="text"
							required
							minLength={1}
							maxLength={24}
							className="rounded-2xl w-full mt-1 px-4 py-2 border bg-neutral-900 border-neutral-800 inset-shadow-2xs focus-visible:outline-2 focus-visible:outline-neutral-50"
							value={roomId}
							onChange={(event) => setRoomId(event.target.value)}
						/>
					</div>
					<div>
						<label htmlFor="username" className="ml-2">
							Username
						</label>
						<input
							id="username"
							type="text"
							required
							minLength={1}
							maxLength={24}
							autoComplete="username"
							className="rounded-2xl w-full mt-1 px-4 py-2 border bg-neutral-900 border-neutral-800 inset-shadow-2xs focus-visible:outline-2 focus-visible:outline-neutral-50"
							value={username}
							onChange={(event) => setUsername(event.target.value)}
						/>
					</div>
					<button
						type="submit"
						aria-describedby="connection-status"
						disabled={
							roomId.trim().length === 0 || username.trim().length === 0 || !isConnected
						}
						className="text-neutral-900 w-full font-medium bg-neutral-200 rounded-xl mt-3 p-3 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 outline-offset-2 outline-neutral-50 cursor-pointer"
					>
						Join Chat
					</button>
				</form>
			</div>
			<footer className="mt-auto pt-10 text-center text-sm text-neutral-500">
				<p>{`Made with ❤️ by Bartosz Trusiński`}</p>
			</footer>
		</main>
	);
}
