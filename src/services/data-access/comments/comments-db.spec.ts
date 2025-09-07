import makeCommentsDb from "./comment-repository";
import makeComment from "../../../domain/comment";
import { type Database, type CommentInput } from "../../../shared/types";

describe('Comments Database', () => {
  let commentsDb: ReturnType<typeof makeCommentsDb>;
  let mockDatabase: jest.Mocked<Database>;
  let queryResults: any[] = [];

  beforeEach(() => {
    queryResults = [];
    mockDatabase = {
      query: jest.fn().mockImplementation(() => Promise.resolve({ rows: queryResults }))
    };

    commentsDb = makeCommentsDb({
      makeDatabase: () => mockDatabase
    });
  });

  const mockCommentInput: CommentInput = {
    id: 'test-comment-id',
    text: 'This is a test comment',
    author: 'John Doe',
    postId: 'test-post-id',
    replyToId: 'parent-comment-id',
    published: true,
    source: {
      ip: '192.168.1.1',
      browser: 'Chrome 95',
      referer: 'https://example.com'
    }
  };

  // Fix the insert test data to match what makeComment would return
  const mockDbResult = {
    id: 'test-comment-id',
    text: 'This is a test comment',
    author: 'John Doe',
    post_id: 'test-post-id',
    reply_to_id: 'parent-comment-id',
    published: true,
    created_on: new Date(),
    modified_on: new Date(),
    ip: '192.168.1.1',
    browser: 'Chrome 95',
    referer: 'https://example.com',
    hash: 'dummy-hash'
  };

  describe('insert', () => {
    it('should insert a comment and return the result', async () => {
      queryResults.push(mockDbResult);
      
      const mockComment = makeComment(mockCommentInput);
      const result = await commentsDb.insert(mockComment);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.comments'),
        [
          'test-comment-id',
          'This is a test comment',
          'John Doe',
          'test-post-id',
          'parent-comment-id',
          true,
          mockComment.getModifiedOn(),
          '192.168.1.1',
          'Chrome 95',
          'https://example.com',
          mockComment.getHash()
        ]
      );

      expect(result).toEqual(mockDbResult);
    });
  });

  describe('findById', () => {
    it('should find a comment by id', async () => {
      const mockDbResult = {
        id: 'test-comment-id',
        text: 'This is a test comment',
        author: 'John Doe'
      };

      queryResults.push(mockDbResult);

      const result = await commentsDb.findById('test-comment-id');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        'SELECT * FROM public.comments WHERE id = $1 AND deleted_at IS NULL',
        ['test-comment-id']
      );

      expect(result).toEqual(mockDbResult);
    });

    it('should return undefined if comment not found', async () => {
      queryResults = []; // Empty result

      const result = await commentsDb.findById('non-existent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('findByHash', () => {
    it('should find a comment by hash', async () => {
      const mockDbResult = {
        id: 'test-comment-id',
        hash: 'test-hash',
        text: 'Comment with specific hash'
      };

      queryResults.push(mockDbResult);

      const result = await commentsDb.findByHash('test-hash');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT *'),
        ['test-hash']
      );

      expect(result).toEqual(mockDbResult);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a comment', async () => {
      const mockDbResult = {
        id: 'test-comment-id',
        deleted_at: new Date('2023-01-01T00:00:00Z')
      };

      queryResults.push(mockDbResult);

      const result = await commentsDb.softDelete('test-comment-id');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE public.comments'),
        ['test-comment-id']
      );

      expect(result).toEqual(mockDbResult);
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete a comment', async () => {
      const mockDbResult = {
        id: 'test-comment-id',
        text: 'Deleted comment'
      };

      queryResults.push(mockDbResult);

      const result = await commentsDb.hardDelete('test-comment-id');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        ['test-comment-id']
      );

      expect(result).toEqual(mockDbResult);
    });
  });

  describe('publish', () => {
    it('should publish a comment', async () => {
      const mockDbResult = {
        id: 'test-comment-id',
        published: true
      };

      queryResults.push(mockDbResult);

      const result = await commentsDb.publish('test-comment-id');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('SET published   = true'),
        ['test-comment-id']
      );

      expect(result).toEqual(mockDbResult);
    });
  });

  describe('unpublish', () => {
    it('should unpublish a comment', async () => {
      const mockDbResult = {
        id: 'test-comment-id',
        published: false
      };

      queryResults.push(mockDbResult);

      const result = await commentsDb.unpublish('test-comment-id');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('SET published   = false'),
        ['test-comment-id']
      );

      expect(result).toEqual(mockDbResult);
    });
  });

  describe('findByPostId', () => {
    it('should find all comments for a post', async () => {
      const mockDbResults = [
        { id: 'comment-1', post_id: 'test-post-id', text: 'First comment' },
        { id: 'comment-2', post_id: 'test-post-id', text: 'Second comment' }
      ];

      queryResults.push(...mockDbResults);

      const result = await commentsDb.findByPostId('test-post-id');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        'SELECT * FROM public.comments WHERE post_id = $1 AND deleted_at IS NULL ORDER BY created_on ASC',
        ['test-post-id']
      );

      expect(result).toEqual(mockDbResults);
    });
  });

  describe('findPublishedByPostId', () => {
    it('should find only published comments for a post', async () => {
      const mockDbResults = [
        { id: 'comment-1', post_id: 'test-post-id', published: true }
      ];

      queryResults.push(...mockDbResults);

      const result = await commentsDb.findPublishedByPostId('test-post-id');

      expect(mockDatabase.query).toHaveBeenCalledWith(
        'SELECT * FROM public.comments WHERE post_id = $1 AND published = true AND deleted_at IS NULL ORDER BY created_on ASC',
        ['test-post-id']
      );

      expect(result).toEqual(mockDbResults);
    });
  });
});