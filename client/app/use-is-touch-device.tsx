import { useEffect, useState } from 'react';

export function useIsTouchDevice() {
	const [isTouchDevice, setIsTouchDevice] = useState<boolean | null>(null);

	useEffect(() => {
		setIsTouchDevice(
			navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches,
		);
	}, []);

	return isTouchDevice;
}
