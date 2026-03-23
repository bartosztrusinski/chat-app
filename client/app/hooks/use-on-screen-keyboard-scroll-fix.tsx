import { useEffect } from 'react';

export function useOnScreenKeyboardScrollFix() {
	useEffect(() => {
		const handleScroll = () => {
			window.scrollTo(0, 0);
		};

		window.addEventListener('scroll', handleScroll);

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);
}
