type ClientToServerChatMessage = {
	roomId: string;
	body: string;
};

export type ServerToClientChatMessage =
	| {
			type: 'chat';
			body: string;
			user: User;
	  }
	| {
			type: 'system';
			body: string;
	  };

export type User = {
	id: string;
	name: string;
};

export type ServerToClientEvents = {
	chatMessage: (message: ServerToClientChatMessage) => void;
	joinRoom: (message: ServerToClientChatMessage) => void;
	leaveRoom: (message: ServerToClientChatMessage) => void;
};

export type ClientToServerEvents = {
	chatMessage: (message: ClientToServerChatMessage) => void;
	setUser: (user: User) => void;
	joinRoom: (roomId: string) => void;
	leaveRoom: (roomId: string) => void;
};
