import { createApp, createRouter, defineEventHandler, toNodeListener,  } from 'h3';
import { createServer } from 'node:http';
import "dotenv/config";

const app = createApp();
const router = createRouter();

// Root endpoint
router.get('/', defineEventHandler(async () => {
  return { message: 'Comments API is running!' };
}));

// Health check endpoint
router.get('/health', defineEventHandler(async () => {
  return { status: 'OK', timestamp: new Date().toISOString() };
}));

app.use(router);

const PORT = process.env.PORT || 3000;

createServer(toNodeListener(app)).listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});