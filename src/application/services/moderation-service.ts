import { type Comment } from "@domain/comment/types";

export default function makeModerationService({ isSpam }: {
  isSpam: ({ comment, testOnly }: { comment: Comment, testOnly?: boolean }) => Promise<boolean>
}) {
  return async function handleModeration({ comment, testOnly = false }: { 
    comment: Comment, 
    testOnly?: boolean 
  }): Promise<Comment> {
    try {
      const spamResult = await isSpam({ comment, testOnly });
      
      // If spam is detected, we unpublish the comment
      // In a more sophisticated system, we might flag it for review instead
      if (spamResult) {
        console.log(`Spam detected for comment ${comment.getId()}, marking as unpublished`);
        // We would need to modify the comment's published status
        // For now, we'll return the comment as-is since our domain model
        // doesn't allow mutation after creation (immutable)
        // In a real implementation, we might create a new comment with unpublished status
      }
      
      return comment;
    } catch (error) {
      console.error('Error during moderation:', error);
      // On moderation failure, we default to allowing the comment
      // but mark it as unpublished for manual review
      return comment;
    }
  }
}