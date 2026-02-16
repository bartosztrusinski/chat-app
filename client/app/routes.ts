import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [
	index('routes/join.tsx'),
	route('chat/:roomId', 'routes/chat.tsx'),
] satisfies RouteConfig;
