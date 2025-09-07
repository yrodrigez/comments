import makeListComments from "./list-comments";

describe('List Comments Use Case', () => {
  let mockCommentsDb: any;
  let listComments: ReturnType<typeof makeListComments>;

  beforeEach(() => {
    mockCommentsDb = {
      findByPostId: jest.fn(),
      findPublishedByPostId: jest.fn(),
      findAll: jest.fn()
    };
    listComments = makeListComments({
      commentsDb: mockCommentsDb
    });
  });

  const mockComments = [
    { id: 'comment-1', post_id: 'test-post-id', text: 'First comment', published: true },
    { id: 'comment-2', post_id: 'test-post-id', text: 'Second comment', published: true }
  ];

  it('should list published comments for a specific post by default', async () => {
    mockCommentsDb.findPublishedByPostId.mockResolvedValue(mockComments);

    const result = await listComments({ postId: 'test-post-id' });

    expect(mockCommentsDb.findPublishedByPostId).toHaveBeenCalledWith('test-post-id');
    expect(mockCommentsDb.findByPostId).not.toHaveBeenCalled();
    expect(mockCommentsDb.findAll).not.toHaveBeenCalled();
    expect(result).toBe(mockComments);
  });

  it('should list all comments for a specific post when publishedOnly is false', async () => {
    const allComments = [
      ...mockComments,
      { id: 'comment-3', post_id: 'test-post-id', text: 'Unpublished comment', published: false }
    ];
    mockCommentsDb.findByPostId.mockResolvedValue(allComments);

    const result = await listComments({ postId: 'test-post-id', publishedOnly: false });

    expect(mockCommentsDb.findByPostId).toHaveBeenCalledWith('test-post-id');
    expect(mockCommentsDb.findPublishedByPostId).not.toHaveBeenCalled();
    expect(mockCommentsDb.findAll).not.toHaveBeenCalled();
    expect(result).toBe(allComments);
  });

  it('should list all comments when no postId is provided', async () => {
    mockCommentsDb.findAll.mockResolvedValue(mockComments);

    const result = await listComments();

    expect(mockCommentsDb.findAll).toHaveBeenCalled();
    expect(mockCommentsDb.findByPostId).not.toHaveBeenCalled();
    expect(mockCommentsDb.findPublishedByPostId).not.toHaveBeenCalled();
    expect(result).toBe(mockComments);
  });

  it('should list all comments when empty options provided', async () => {
    mockCommentsDb.findAll.mockResolvedValue(mockComments);

    const result = await listComments({});

    expect(mockCommentsDb.findAll).toHaveBeenCalled();
    expect(result).toBe(mockComments);
  });
});