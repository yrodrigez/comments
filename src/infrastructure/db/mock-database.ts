import { type Database } from '../../shared/types';

// Mock database for development/demo purposes
export default function makeMockDatabase(): Database {
  const comments: any[] = [];
  
  return Object.freeze({
    async query(text: string, params?: any[]) {
      console.log('Mock DB Query:', text, params);
      
      // Simple mock responses for basic operations
      if (text.includes('INSERT INTO')) {
        const mockComment = {
          id: params?.[0] || 'mock-id',
          text: params?.[1] || 'Mock comment',
          author: params?.[2] || 'Mock User',
          post_id: params?.[3] || 'mock-post-id',
          reply_to_id: params?.[4],
          published: params?.[5] || false,
          created_on: new Date(),
          modified_on: params?.[6] || new Date(),
          ip: params?.[7] || '127.0.0.1',
          browser: params?.[8] || 'Mock Browser',
          referer: params?.[9],
          hash: params?.[10] || 'mock-hash'
        };
        comments.push(mockComment);
        return { rows: [mockComment] };
      }
      
      if (text.includes('SELECT') && text.includes('WHERE hash')) {
        const hash = params?.[0];
        const found = comments.find(c => c.hash === hash);
        return { rows: found ? [found] : [] };
      }
      
      if (text.includes('SELECT') && text.includes('WHERE id')) {
        const id = params?.[0];
        const found = comments.find(c => c.id === id);
        return { rows: found ? [found] : [] };
      }
      
      if (text.includes('SELECT') && text.includes('post_id')) {
        const postId = params?.[0];
        const filtered = comments.filter(c => c.post_id === postId && !c.deleted_at);
        return { rows: filtered };
      }
      
      if (text.includes('UPDATE') && text.includes('deleted_at')) {
        const id = params?.[0];
        const comment = comments.find(c => c.id === id);
        if (comment) {
          comment.deleted_at = new Date();
          return { rows: [comment] };
        }
        return { rows: [] };
      }
      
      if (text.includes('SELECT') && !text.includes('WHERE')) {
        return { rows: comments.filter(c => !c.deleted_at) };
      }
      
      return { rows: [] };
    }
  });
}