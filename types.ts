export type User = {
	id: string;
	name: string;
};

export type ClientChatMessage = {
	roomId: string;
	body: string;
};

export type ServerChatMessage =
	| {
			type: 'chat';
			body: string;
			user: User;
	  }
	| {
			type: 'system';
			body: string;
	  };

export type PendingLeave = {
	timeoutId: NodeJS.Timeout;
	username: string;
};
