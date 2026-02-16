import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [
	index('routes/join.tsx'),
	route('chat', 'routes/chat.tsx'),
] satisfies RouteConfig;
