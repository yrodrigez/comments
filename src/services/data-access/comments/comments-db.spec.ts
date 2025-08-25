import makeCommentsDb from './comments-db.js';
import buildMakeComment from '@domain/comment/comment.js';
import buildMakeSource from '@domain/comment/source.js';
import crypto from 'node:crypto';

describe('Comments Database', () => {
    let commentsDb: any;
    let mockDatabase: any;
    let mockComment: any;
    let queryResults: any[];

    // Mock dependencies
    const mockId = {
        makeId: () => 'test-comment-id',
        isValidId: (id: string): boolean => Boolean(id && id.length > 0 && !id.includes(' '))
    };

    const mockMd5 = (input: string) => crypto.createHash('md5').update(input).digest('hex');
    const mockSanitize = (input: string) => input.replace(/<[^>]*>/g, '').trim();
    const mockIsValidIp = (ip: string) => /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);

    const mockMakeSource = buildMakeSource({ isValidIp: mockIsValidIp });
    const makeComment = buildMakeComment({
        Id: mockId,
        md5: mockMd5,
        sanitize: mockSanitize,
        makeSource: mockMakeSource
    });

    beforeEach(() => {
        queryResults = [];

        mockDatabase = {
            query: jest.fn().mockImplementation(() => Promise.resolve({ rows: queryResults })),
            getClient: jest.fn().mockResolvedValue({}),
            end: jest.fn().mockResolvedValue(undefined)
        };

        const makeDatabase = () => mockDatabase;

        commentsDb = makeCommentsDb({ makeDatabase });

        // Create a mock comment
        mockComment = makeComment({
            id: 'test-comment-id',
            author: 'John Doe',
            source: { ip: '192.168.1.1', browser: 'Chrome 95', referer: 'https://example.com' },
            modifiedOn: new Date('2023-01-01T00:00:00Z'),
            postId: 'test-post-id',
            published: true,
            replyToId: 'parent-comment-id',
            text: 'This is a test comment'
        });
    });

    describe('insert', () => {
        it('should insert a comment into the database', async () => {
            const mockDbResult = {
                id: 'test-comment-id',
                text: 'This is a test comment',
                author: 'John Doe',
                post_id: 'test-post-id',
                reply_to_id: 'parent-comment-id',
                published: true,
                created_at: new Date('2023-01-01T00:00:00Z'),
                modified_on: new Date('2023-01-01T00:00:00Z'),
                ip: '192.168.1.1',
                browser: 'Chrome 95',
                referer: 'https://example.com',
                hash: mockComment.getHash(),
                deleted_at: null
            };

            queryResults.push(mockDbResult);

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

    describe('findByAuthor', () => {
        it('should find comments by author', async () => {
            const mockDbResults = [
                { id: 'comment-1', author: 'John Doe', text: 'Comment 1' },
                { id: 'comment-2', author: 'John Doe', text: 'Comment 2' }
            ];

            queryResults.push(...mockDbResults);

            const result = await commentsDb.findByAuthor('John Doe');

            expect(mockDatabase.query).toHaveBeenCalledWith(
                'SELECT * FROM public.comments WHERE author = $1 AND deleted_at IS NULL',
                ['John Doe']
            );

            expect(result).toEqual(mockDbResults);
        });
    });

    describe('findByPostId', () => {
        it('should find comments by post id', async () => {
            const mockDbResults = [
                { id: 'comment-1', post_id: 'test-post-id', text: 'Comment 1' },
                { id: 'comment-2', post_id: 'test-post-id', text: 'Comment 2' }
            ];

            queryResults.push(...mockDbResults);

            const result = await commentsDb.findByPostId('test-post-id');

            expect(mockDatabase.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM public.comments'),
                ['test-post-id']
            );

            expect(result).toEqual(mockDbResults);
        });
    });

    describe('findPublishedByPostId', () => {
        it('should find only published comments by post id', async () => {
            const mockDbResults = [
                { id: 'comment-1', post_id: 'test-post-id', published: true, text: 'Published comment' }
            ];

            queryResults.push(...mockDbResults);

            const result = await commentsDb.findPublishedByPostId('test-post-id');

            expect(mockDatabase.query).toHaveBeenCalledWith(
                expect.stringContaining('published = true'),
                ['test-post-id']
            );

            expect(result).toEqual(mockDbResults);
        });
    });

    describe('findReplies', () => {
        it('should find replies to a comment', async () => {
            const mockDbResults = [
                { id: 'reply-1', reply_to_id: 'parent-comment-id', text: 'Reply 1' },
                { id: 'reply-2', reply_to_id: 'parent-comment-id', text: 'Reply 2' }
            ];

            queryResults.push(...mockDbResults);

            const result = await commentsDb.findReplies('parent-comment-id');

            expect(mockDatabase.query).toHaveBeenCalledWith(
                expect.stringContaining('reply_to_id = $1'),
                ['parent-comment-id']
            );

            expect(result).toEqual(mockDbResults);
        });
    });

    describe('findAll', () => {
        it('should find all non-deleted comments', async () => {
            const mockDbResults = [
                { id: 'comment-1', text: 'Comment 1' },
                { id: 'comment-2', text: 'Comment 2' }
            ];

            queryResults.push(...mockDbResults);

            const result = await commentsDb.findAll();

            expect(mockDatabase.query).toHaveBeenCalledWith(
                'SELECT * FROM public.comments WHERE deleted_at IS NULL ORDER BY created_at DESC'
            );

            expect(result).toEqual(mockDbResults);
        });
    });

    describe('update', () => {
        it('should update a comment', async () => {
            const mockDbResult = {
                id: 'test-comment-id',
                text: 'Updated comment text',
                author: 'John Doe'
            };

            queryResults.push(mockDbResult);

            const result = await commentsDb.update(mockComment);

            expect(mockDatabase.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE public.comments'),
                expect.arrayContaining([
                    'test-comment-id',
                    'This is a test comment',
                    'John Doe',
                    'test-post-id',
                    'parent-comment-id',
                    true,
                    '192.168.1.1',
                    'Chrome 95',
                    'https://example.com',
                    mockComment.getHash()
                ])
            );

            expect(result).toEqual(mockDbResult);
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
                'SELECT * FROM public.comments WHERE hash = $1 AND deleted_at IS NULL',
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
                'DELETE FROM public.comments WHERE id = $1 RETURNING *',
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
                expect.stringContaining('SET published = true'),
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
                expect.stringContaining('SET published = false'),
                ['test-comment-id']
            );

            expect(result).toEqual(mockDbResult);
        });
    });
});
