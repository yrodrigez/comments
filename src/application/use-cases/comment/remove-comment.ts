import { type CommentRecord } from "@domain/comment/types";

export default function makeRemoveComment({ commentsDb }: {
  commentsDb: {
    findById: (id: string) => Promise<CommentRecord | undefined>,
    softDelete: (id: string) => Promise<CommentRecord>
  }
}) {
  return async function removeComment({ id }: { id: string }) {
    const existing = await commentsDb.findById(id);
    if (!existing) {
      throw new Error('Comment not found');
    }

    return commentsDb.softDelete(id);
  }
}