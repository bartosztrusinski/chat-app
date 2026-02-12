import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Chat App' },
    {
      name: 'description',
      content: 'A real-time chat application built with React and Socket.IO.',
    },
  ];
}

export default function Home() {
  return <div>Hello world</div>;
}
