import makeComment from "@domain/comment";
import { type Comment, type CommentInput, type CommentRecord } from "@domain/comment/types";

export default function makeUpdateComment({ commentsDb, handleModeration }: {
  commentsDb: {
    findById: (id: string) => Promise<CommentRecord | undefined>,
    update: (comment: Comment) => Promise<CommentRecord>
  },
  handleModeration: ({ comment }: { comment: Comment }) => Promise<Comment>
}) {
  return async function updateComment({ id, updates }: { 
    id: string, 
    updates: Partial<CommentInput> 
  }) {
    const existing = await commentsDb.findById(id);
    if (!existing) {
      throw new Error('Comment not found');
    }

    // Create updated comment input by merging existing data with updates
    const updatedCommentInput: CommentInput = {
      id: existing.id,
      author: updates.author || existing.author,
      text: updates.text || existing.text,
      postId: updates.postId || existing.post_id,
      replyToId: updates.replyToId || existing.reply_to_id,
      published: updates.published !== undefined ? updates.published : existing.published,
      createdOn: existing.created_on,
      modifiedOn: new Date(),
      source: updates.source || {
        ip: existing.ip,
        browser: existing.browser,
        referer: existing.referer || undefined
      }
    };

    const updatedComment = makeComment(updatedCommentInput);
    const moderated = await handleModeration({ comment: updatedComment });
    
    return commentsDb.update(moderated);
  }
}