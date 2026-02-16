import { type SubmitEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { socket } from '~/socket';

export default function Join() {
	const navigate = useNavigate();
	const [isConnected, setIsConnected] = useState(socket.connected);
	const [roomId, setRoomId] = useState('');

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
		if (roomId.trim().length > 0) {
			navigate(`/chat/${roomId}`);
		}
	}

	return (
		<div className="space-y-8 p-4">
			<title>Chat App</title>
			<meta
				name="description"
				content="A real-time chat application built with React and Socket.IO."
			/>
			<h1 className="text-2xl font-bold">Chat App</h1>

			<section className="space-x-2">
				<p className="pb-2">
					{isConnected ? 'Connected to the server!' : 'Disconnected from the server'}
				</p>
				<button
					type="button"
					onClick={() => socket.disconnect()}
					disabled={!isConnected}
					className="bg-neutral-50 text-neutral-900 rounded p-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Disconnect
				</button>
				<button
					type="button"
					onClick={() => socket.connect()}
					disabled={isConnected}
					className="bg-neutral-50 text-neutral-900 rounded p-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Reconnect
				</button>
			</section>

			<section>
				<form className="space-x-2" onSubmit={joinChatRoom}>
					<label htmlFor="room-id">Room ID:</label>
					<input
						id="room-id"
						type="text"
						className="border rounded p-2 "
						value={roomId}
						onChange={(event) => setRoomId(event.target.value)}
					/>
					<button
						type="submit"
						disabled={roomId.trim().length === 0 || !isConnected}
						className="bg-neutral-50 text-neutral-900 rounded p-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Join Chat
					</button>
				</form>
			</section>
		</div>
	);
}
