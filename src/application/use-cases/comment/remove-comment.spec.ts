import makeRemoveComment from "./remove-comment";

describe('Remove Comment Use Case', () => {
  let mockCommentsDb: any;
  let removeComment: ReturnType<typeof makeRemoveComment>;

  beforeEach(() => {
    mockCommentsDb = {
      findById: jest.fn(),
      softDelete: jest.fn()
    };
    removeComment = makeRemoveComment({
      commentsDb: mockCommentsDb
    });
  });

  it('should remove an existing comment', async () => {
    const existingComment = {
      id: 'test-comment-id',
      text: 'This is a test comment',
      author: 'John Doe'
    };
    const deletedComment = {
      ...existingComment,
      deleted_at: new Date()
    };

    mockCommentsDb.findById.mockResolvedValue(existingComment);
    mockCommentsDb.softDelete.mockResolvedValue(deletedComment);

    const result = await removeComment({ id: 'test-comment-id' });

    expect(mockCommentsDb.findById).toHaveBeenCalledWith('test-comment-id');
    expect(mockCommentsDb.softDelete).toHaveBeenCalledWith('test-comment-id');
    expect(result).toBe(deletedComment);
  });

  it('should throw error if comment not found', async () => {
    mockCommentsDb.findById.mockResolvedValue(undefined);

    await expect(removeComment({ id: 'non-existent-id' }))
      .rejects.toThrow('Comment not found');

    expect(mockCommentsDb.findById).toHaveBeenCalledWith('non-existent-id');
    expect(mockCommentsDb.softDelete).not.toHaveBeenCalled();
  });
});