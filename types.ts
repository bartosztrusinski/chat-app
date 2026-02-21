export type User = {
	id: string;
	name: string;
};

export type ClientChatMessage = {
	roomId: string;
	body: string;
};

export type ServerChatMessage = {
	body: string;
	user: User;
};
