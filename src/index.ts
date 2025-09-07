import { createApp, createRouter, defineEventHandler, toNodeListener } from 'h3';
import { createServer } from 'node:http';
import "dotenv/config";
import { handleAddComment, handleRemoveComment, handleListComments, handleUpdateComment } from './api/handlers';

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

// Comments API endpoints
router.post('/api/comments', handleAddComment);
router.delete('/api/comments', handleRemoveComment);
router.get('/api/comments', handleListComments);
router.put('/api/comments', handleUpdateComment);

app.use(router);

const PORT = process.env.PORT || 3000;

createServer(toNodeListener(app)).listen(PORT, () => {
  console.log(`Comments microservice is running on port ${PORT}`);
  console.log(`API endpoints available:`);
  console.log(`  POST   /api/comments     - Add a new comment`);
  console.log(`  GET    /api/comments     - List comments`);
  console.log(`  PUT    /api/comments     - Update a comment`);
  console.log(`  DELETE /api/comments     - Remove a comment`);
});