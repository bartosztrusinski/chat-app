import cors from 'cors';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.get('/', (_, res) => {
	res.send('Hello from the server');
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
