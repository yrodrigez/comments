import { defineEventHandler, readBody, getQuery, createError } from 'h3';
import { addComment, removeComment, listComments, updateComment } from './dependencies';
import { type CommentInput } from '../shared/types';

export const handleAddComment = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // Extract IP from headers
    const ip = event.node.req.headers['x-forwarded-for'] || 
              event.node.req.headers['x-real-ip'] || 
              event.node.req.connection?.remoteAddress || 
              '127.0.0.1';
    
    // Extract user agent
    const userAgent = event.node.req.headers['user-agent'] || 'Unknown';
    
    // Extract referer
    const referer = event.node.req.headers['referer'];

    const commentInput: CommentInput = {
      ...body,
      source: {
        ip: Array.isArray(ip) ? ip[0] : ip as string,
        browser: userAgent,
        referer: referer as string
      }
    };

    const result = await addComment(commentInput);
    return { success: true, data: result };
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to add comment'
    });
  }
});

export const handleRemoveComment = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { id } = body;
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Comment ID is required'
      });
    }

    const result = await removeComment({ id });
    return { success: true, data: result };
  } catch (error: any) {
    if (error.message === 'Comment not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Comment not found'
      });
    }
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to remove comment'
    });
  }
});

export const handleListComments = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const postId = query.postId as string;
    const publishedOnly = query.publishedOnly !== 'false'; // Default to true

    const result = await listComments({ 
      ...(postId && { postId }), 
      publishedOnly 
    });
    return { success: true, data: result };
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to list comments'
    });
  }
});

export const handleUpdateComment = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { id, updates } = body;
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Comment ID is required'
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Updates are required'
      });
    }

    const result = await updateComment({ id, updates });
    return { success: true, data: result };
  } catch (error: any) {
    if (error.message === 'Comment not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Comment not found'
      });
    }
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to update comment'
    });
  }
});