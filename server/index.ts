import { createServer } from 'node:http';
import cors from 'cors';
import express from 'express';

const PORT = process.env.PORT ?? 5000;

const app = express();
const server = createServer(app);

app.use(cors());

app.get('/', (_, res) => {
	res.send('Hello from the server');
});

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
