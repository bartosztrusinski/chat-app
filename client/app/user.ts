import { socket } from '~/socket';
import { SET_USERNAME_EVENT } from '../../constants';
import type { User } from '../../types';

const USER_KEY = 'user';

export function getUser(): User | null {
	// fallback for SSR
	if (typeof sessionStorage === 'undefined') {
		return null;
	}

	try {
		const userData = sessionStorage.getItem(USER_KEY);
		return userData ? JSON.parse(userData) : null;
	} catch {
		return null;
	}
}

export function updateUsername(name: string) {
	// fallback for SSR
	if (typeof sessionStorage === 'undefined') {
		return null;
	}

	const currentUser = getUser();
	const id = currentUser?.id ?? crypto.randomUUID();
	const user = { id, name } satisfies User;

	try {
		sessionStorage.setItem(USER_KEY, JSON.stringify(user));
		socket.timeout(2000).emit(SET_USERNAME_EVENT, name);
	} catch (error) {
		console.error('Failed to update username:', error);
	}
}
