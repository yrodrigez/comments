import { createId } from "@paralleldrive/cuid2";
import { createHash } from "crypto";
import sanitizeHtml from "sanitize-html";
import { type Comment, type CommentInput, type CommentSource } from "@shared/types";

export default function makeComment(commentInput: CommentInput): Comment {
  // Validation
  if (!commentInput.author || commentInput.author.trim() === '') {
    throw new Error('Invalid comment author');
  }

  if (!commentInput.postId || commentInput.postId.trim() === '') {
    throw new Error('Invalid post ID');
  }

  // Sanitize and validate text
  const sanitizedText = sanitizeHtml(commentInput.text || '', {
    allowedTags: [],
    allowedAttributes: {}
  }).trim();

  if (!sanitizedText) {
    throw new Error('Comment text is required');
  }

  // Validate IDs if provided
  const id = commentInput.id || createId();
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error('Invalid comment ID');
  }

  if (commentInput.replyToId && !/^[a-zA-Z0-9_-]+$/.test(commentInput.replyToId)) {
    throw new Error('Invalid reply-to comment ID');
  }

  // Validate source
  if (!commentInput.source?.ip || !commentInput.source?.browser) {
    throw new Error('Invalid comment source');
  }

  const createdOn = commentInput.createdOn || new Date();
  const modifiedOn = commentInput.modifiedOn || createdOn;

  // Create hash for duplicate detection
  const hashInput = JSON.stringify({
    author: commentInput.author,
    text: sanitizedText,
    postId: commentInput.postId,
    ip: commentInput.source.ip
  });
  const hash = createHash('md5').update(hashInput).digest('hex');

  let isDeleted = false;
  let originalText = sanitizedText;
  let originalAuthor = commentInput.author;

  return Object.freeze({
    getId(): string {
      return id;
    },

    getAuthor(): string {
      return isDeleted ? 'deleted' : originalAuthor;
    },

    getText(showDeleted = false): string {
      if (isDeleted) {
        return showDeleted ? 'This comment has been deleted.' : '';
      }
      return originalText;
    },

    getPostId(): string {
      return commentInput.postId;
    },

    getReplyToId(): string | undefined {
      return commentInput.replyToId;
    },

    isPublished(): boolean {
      return commentInput.published || false;
    },

    getCreatedOn(): Date {
      return createdOn;
    },

    getModifiedOn(): Date {
      return modifiedOn;
    },

    getSource(): CommentSource {
      return {
        ip: commentInput.source.ip,
        browser: commentInput.source.browser,
        referer: commentInput.source.referer || undefined
      };
    },

    getHash(): string {
      return hash;
    },

    markAsDeleted(): void {
      isDeleted = true;
    }
  });
}