const USER_ID_KEY = 'user-id';

export function getUserId() {
	const userId = sessionStorage.getItem(USER_ID_KEY);

	if (!userId) {
		const newUserId = crypto.randomUUID();
		sessionStorage.setItem(USER_ID_KEY, newUserId);
		return newUserId;
	}

	return userId;
}
