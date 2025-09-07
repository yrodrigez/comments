import makeAddComment from "./add-comment";
import makeComment from "../../../domain/comment";
import { type CommentInput } from "../../../shared/types";

describe('Add Comment Use Case', () => {
  let mockCommentsDb: any;
  let mockHandleModeration: jest.Mock;
  let addComment: ReturnType<typeof makeAddComment>;

  beforeEach(() => {
    mockCommentsDb = {
      findByHash: jest.fn(),
      insert: jest.fn()
    };
    mockHandleModeration = jest.fn();
    addComment = makeAddComment({
      commentsDb: mockCommentsDb,
      handleModeration: mockHandleModeration
    });
  });

  const validCommentInput: CommentInput = {
    author: 'John Doe',
    text: 'This is a test comment',
    postId: 'valid-post-id',
    source: {
      ip: '192.168.1.1',
      browser: 'Chrome 95',
      referer: 'https://example.com'
    }
  };

  it('should add a new comment successfully', async () => {
    const comment = makeComment(validCommentInput);
    const moderatedComment = makeComment({ ...validCommentInput, published: true });
    
    mockCommentsDb.findByHash.mockResolvedValue(null);
    mockHandleModeration.mockResolvedValue(moderatedComment);
    mockCommentsDb.insert.mockResolvedValue(moderatedComment);

    const result = await addComment(validCommentInput);

    expect(mockCommentsDb.findByHash).toHaveBeenCalledWith({ hash: comment.getHash() });
    expect(mockHandleModeration).toHaveBeenCalledWith({ comment });
    expect(mockCommentsDb.insert).toHaveBeenCalled();
    expect(result).toBe(moderatedComment);
  });

  it('should return existing comment if duplicate hash found', async () => {
    const existingComment = makeComment(validCommentInput);
    
    mockCommentsDb.findByHash.mockResolvedValue(existingComment);

    const result = await addComment(validCommentInput);

    expect(mockCommentsDb.findByHash).toHaveBeenCalled();
    expect(mockHandleModeration).not.toHaveBeenCalled();
    expect(mockCommentsDb.insert).not.toHaveBeenCalled();
    expect(result).toBe(existingComment);
  });

  it('should handle moderation and insert moderated comment', async () => {
    const comment = makeComment(validCommentInput);
    const moderatedComment = makeComment({ ...validCommentInput, published: false });
    
    mockCommentsDb.findByHash.mockResolvedValue(null);
    mockHandleModeration.mockResolvedValue(moderatedComment);
    mockCommentsDb.insert.mockResolvedValue(moderatedComment);

    const result = await addComment(validCommentInput);

    expect(mockHandleModeration).toHaveBeenCalledWith({ comment });
    expect(mockCommentsDb.insert).toHaveBeenCalledWith({
      author: moderatedComment.getAuthor(),
      createdOn: moderatedComment.getCreatedOn(),
      id: moderatedComment.getId(),
      modifiedOn: moderatedComment.getModifiedOn(),
      postId: moderatedComment.getPostId(),
      published: moderatedComment.isPublished(),
      replyToId: moderatedComment.getReplyToId() || undefined,
      source: {
        ip: '192.168.1.1',
        browser: 'Chrome 95',
        referer: 'https://example.com'
      },
      text: moderatedComment.getText()
    });
    expect(result).toBe(moderatedComment);
  });
});