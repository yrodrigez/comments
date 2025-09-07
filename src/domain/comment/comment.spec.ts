import makeComment from "./index";
import { type CommentInput } from "../../shared/types";

// Mock the cuid2 module
jest.mock("@paralleldrive/cuid2", () => ({
  createId: jest.fn(() => 'test-id-123'),
  isCuid: jest.fn(() => true)
}));

describe('Comment Entity', () => {

  const validCommentData: CommentInput = {
    author: 'John Doe',
    source: { ip: '192.168.1.1', browser: 'Chrome 95' },
    postId: 'valid-post-id',
    text: 'This is a test comment'
  };

  describe('Comment creation', () => {
    it('should create a comment with valid data', () => {
      const comment = makeComment(validCommentData);

      expect(comment.getId()).toBe('test-id-123');
      expect(comment.getAuthor()).toBe('John Doe');
      expect(comment.getPostId()).toBe('valid-post-id');
      expect(comment.getText()).toBe('This is a test comment');
      expect(comment.isPublished()).toBe(false);
      expect(comment.getReplyToId()).toBeUndefined();
    });

    it('should create a comment with custom id', () => {
      const comment = makeComment({
        ...validCommentData,
        id: 'custom-id'
      });

      expect(comment.getId()).toBe('custom-id');
    });

    it('should create a published comment', () => {
      const comment = makeComment({
        ...validCommentData,
        published: true
      });

      expect(comment.isPublished()).toBe(true);
    });

    it('should create a reply comment', () => {
      const comment = makeComment({
        ...validCommentData,
        replyToId: 'parent-comment-id'
      });

      expect(comment.getReplyToId()).toBe('parent-comment-id');
    });

    it('should set modifiedOn date', () => {
      const testDate = new Date('2023-01-01');
      const comment = makeComment({
        ...validCommentData,
        modifiedOn: testDate
      });

      expect(comment.getModifiedOn()).toBe(testDate);
    });

    it('should generate a hash for the comment', () => {
      const comment = makeComment(validCommentData);
      const hash = comment.getHash();

      expect(hash).toBeDefined();
      expect(hash).toHaveLength(32); // MD5 hash length
    });

    it('should sanitize HTML in comment text', () => {
      const comment = makeComment({
        ...validCommentData,
        text: '<script>alert("xss")</script>Clean text'
      });

      expect(comment.getText()).toBe('Clean text');
    });
  });

  describe('Comment validation', () => {
    it('should throw error for invalid comment ID', () => {
      expect(() => makeComment({
        ...validCommentData,
        id: 'invalid id with spaces'
      })).toThrow('Invalid comment ID');
    });

    it('should throw error for missing author', () => {
      expect(() => makeComment({
        ...validCommentData,
        author: undefined as any
      })).toThrow('Invalid comment author');
    });

    it('should throw error for empty author', () => {
      expect(() => makeComment({
        ...validCommentData,
        author: ''
      })).toThrow('Invalid comment author');
    });

    it('should throw error for invalid post ID', () => {
      expect(() => makeComment({
        ...validCommentData,
        postId: ''
      })).toThrow('Invalid post ID');
    });

    it('should throw error for invalid reply-to ID', () => {
      expect(() => makeComment({
        ...validCommentData,
        replyToId: 'invalid reply id'
      })).toThrow('Invalid reply-to comment ID');
    });

    it('should throw error for empty text', () => {
      expect(() => makeComment({
        ...validCommentData,
        text: ''
      })).toThrow('Comment text is required');
    });

    it('should throw error for whitespace-only text', () => {
      expect(() => makeComment({
        ...validCommentData,
        text: '   '
      })).toThrow('Comment text is required');
    });

    it('should throw error for HTML-only text that becomes empty after sanitization', () => {
      expect(() => makeComment({
        ...validCommentData,
        text: '<script></script><div></div>'
      })).toThrow('Comment text is required');
    });
  });

  describe('Comment behavior', () => {
    it('should mark comment as deleted', () => {
      const comment = makeComment(validCommentData);

      comment.markAsDeleted();

      expect(comment.getAuthor()).toBe('deleted');
      expect(comment.getText()).toBe('');
      expect(comment.getText(true)).toBe('This comment has been deleted.');
    });

    it('should return empty text for deleted comment by default', () => {
      const comment = makeComment(validCommentData);

      comment.markAsDeleted();

      expect(comment.getText()).toBe('');
    });

    it('should return deleted text when requested', () => {
      const comment = makeComment(validCommentData);

      comment.markAsDeleted();

      expect(comment.getText(true)).toBe('This comment has been deleted.');
    });

    it('should be immutable', () => {
      const comment = makeComment(validCommentData);

      expect(() => {
        (comment as any).id = 'new-id';
      }).toThrow();
    });

    it('should generate consistent hash for same content', () => {
      const comment1 = makeComment(validCommentData);
      const comment2 = makeComment(validCommentData);

      expect(comment1.getHash()).toBe(comment2.getHash());
    });

    it('should generate different hash for different content', () => {
      const comment1 = makeComment(validCommentData);
      const comment2 = makeComment({
        ...validCommentData,
        text: 'Different text'
      });

      expect(comment1.getHash()).not.toBe(comment2.getHash());
    });
  });
});