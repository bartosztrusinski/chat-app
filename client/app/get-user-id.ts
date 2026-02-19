const USER_ID_KEY = 'user-id';

export function getUserId() {
	// fallback for SSR
	if (typeof sessionStorage === 'undefined') {
		return null;
	}

	const userId = sessionStorage.getItem(USER_ID_KEY);

	if (!userId) {
		const newUserId = crypto.randomUUID();
		sessionStorage.setItem(USER_ID_KEY, newUserId);
		return newUserId;
	}

	return userId;
}
