import makeComment from "@domain/comment";
import { type Comment, type CommentInput } from "@domain/comment/types";

export default function makeAddComment({ commentsDb, handleModeration }: {
  commentsDb: {
    findByHash: ({ hash }: { hash: string }) => Promise<Comment | null>,
    insert: (commentInput: CommentInput) => Promise<Comment>
  },
  handleModeration: ({ comment }: { comment: Comment }) => Promise<Comment>
}) {
  return async function addComment(commentInput: CommentInput) {
    const comment = makeComment(commentInput);
    const exists = await commentsDb.findByHash({ hash: comment.getHash() });
    if (exists) {
      return exists;
    }

    const moderated = await handleModeration({ comment });
    const commentSource = moderated.getSource();
    return commentsDb.insert({
      author: moderated.getAuthor(),
      createdOn: moderated.getCreatedOn(),
      id: moderated.getId(),
      modifiedOn: moderated.getModifiedOn(),
      postId: moderated.getPostId(),
      published: moderated.isPublished(),
      replyToId: moderated.getReplyToId() || undefined,
      source: {
        ip: commentSource.ip,
        browser: commentSource.browser,
        referer: commentSource.referer || undefined
      },
      text: moderated.getText()
    });
  }
}