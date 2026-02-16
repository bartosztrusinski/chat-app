import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { socket } from '~/socket';

export default function Join() {
	const [isConnected, setIsConnected] = useState(socket.connected);

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

				{isConnected && (
					<Link
						to="/chat"
						className="bg-neutral-50 text-neutral-900 rounded p-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Join Chat
					</Link>
				)}
			</section>
		</div>
	);
}
