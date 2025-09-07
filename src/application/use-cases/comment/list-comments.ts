import { type CommentRecord } from "@domain/comment/types";

export default function makeListComments({ commentsDb }: {
  commentsDb: {
    findByPostId: (postId: string) => Promise<CommentRecord[]>,
    findPublishedByPostId: (postId: string) => Promise<CommentRecord[]>,
    findAll: () => Promise<CommentRecord[]>
  }
}) {
  return async function listComments({ postId, publishedOnly = true }: { 
    postId?: string, 
    publishedOnly?: boolean 
  } = {}) {
    if (postId) {
      return publishedOnly 
        ? commentsDb.findPublishedByPostId(postId)
        : commentsDb.findByPostId(postId);
    }
    
    // When no postId is provided, return all comments (typically used by admins)
    // In a real implementation, this might need additional authorization checks
    return commentsDb.findAll();
  }
}