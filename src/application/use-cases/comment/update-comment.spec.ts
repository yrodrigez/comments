import makeUpdateComment from "./update-comment";
import { type CommentInput } from "../../../shared/types";

describe('Update Comment Use Case', () => {
  let mockCommentsDb: any;
  let mockHandleModeration: jest.Mock;
  let updateComment: ReturnType<typeof makeUpdateComment>;

  beforeEach(() => {
    mockCommentsDb = {
      findById: jest.fn(),
      update: jest.fn()
    };
    mockHandleModeration = jest.fn();
    updateComment = makeUpdateComment({
      commentsDb: mockCommentsDb,
      handleModeration: mockHandleModeration
    });
  });

  const existingCommentRecord = {
    id: 'test-comment-id',
    text: 'Original text',
    author: 'John Doe',
    post_id: 'test-post-id',
    reply_to_id: null,
    published: true,
    created_on: new Date('2023-01-01'),
    modified_on: new Date('2023-01-01'),
    ip: '192.168.1.1',
    browser: 'Chrome 95',
    referer: 'https://example.com',
    hash: 'original-hash'
  };

  it('should update an existing comment successfully', async () => {
    const updates: Partial<CommentInput> = {
      text: 'Updated text',
      published: false
    };

    const updatedRecord = {
      ...existingCommentRecord,
      text: 'Updated text',
      published: false,
      modified_on: new Date()
    };

    mockCommentsDb.findById.mockResolvedValue(existingCommentRecord);
    mockHandleModeration.mockImplementation(({ comment }) => Promise.resolve(comment));
    mockCommentsDb.update.mockResolvedValue(updatedRecord);

    const result = await updateComment({ id: 'test-comment-id', updates });

    expect(mockCommentsDb.findById).toHaveBeenCalledWith('test-comment-id');
    expect(mockHandleModeration).toHaveBeenCalled();
    expect(mockCommentsDb.update).toHaveBeenCalled();
    expect(result).toBe(updatedRecord);
  });

  it('should throw error if comment not found', async () => {
    const updates: Partial<CommentInput> = {
      text: 'Updated text'
    };

    mockCommentsDb.findById.mockResolvedValue(undefined);

    await expect(updateComment({ id: 'non-existent-id', updates }))
      .rejects.toThrow('Comment not found');

    expect(mockCommentsDb.findById).toHaveBeenCalledWith('non-existent-id');
    expect(mockHandleModeration).not.toHaveBeenCalled();
    expect(mockCommentsDb.update).not.toHaveBeenCalled();
  });

  it('should merge updates with existing data correctly', async () => {
    const updates: Partial<CommentInput> = {
      text: 'Updated text only'
    };

    mockCommentsDb.findById.mockResolvedValue(existingCommentRecord);
    mockHandleModeration.mockImplementation(({ comment }) => {
      // Verify the comment input has the correct merged data
      expect(comment.getText()).toBe('Updated text only');
      expect(comment.getAuthor()).toBe('John Doe'); // Should keep original
      expect(comment.getPostId()).toBe('test-post-id'); // Should keep original
      expect(comment.isPublished()).toBe(true); // Should keep original
      return Promise.resolve(comment);
    });
    mockCommentsDb.update.mockResolvedValue(existingCommentRecord);

    await updateComment({ id: 'test-comment-id', updates });

    expect(mockHandleModeration).toHaveBeenCalled();
  });

  it('should update source information when provided', async () => {
    const updates: Partial<CommentInput> = {
      source: {
        ip: '10.0.0.1',
        browser: 'Firefox 100',
        referer: 'https://newexample.com'
      }
    };

    mockCommentsDb.findById.mockResolvedValue(existingCommentRecord);
    mockHandleModeration.mockImplementation(({ comment }) => {
      const source = comment.getSource();
      expect(source.ip).toBe('10.0.0.1');
      expect(source.browser).toBe('Firefox 100');
      expect(source.referer).toBe('https://newexample.com');
      return Promise.resolve(comment);
    });
    mockCommentsDb.update.mockResolvedValue(existingCommentRecord);

    await updateComment({ id: 'test-comment-id', updates });

    expect(mockHandleModeration).toHaveBeenCalled();
  });
});