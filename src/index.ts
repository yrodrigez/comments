import express, { Request, Response } from 'express';
import cors from 'cors';
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Comments API is running!' });
});


app.get('/healthz', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
