export type ClientChatMessage = {
	roomId: string;
	body: string;
};

export type ServerChatMessage = {
	body: string;
	userId: string;
};
