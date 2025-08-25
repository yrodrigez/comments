import buildMakeComment from './comment';
import buildMakeSource from './source';
import crypto from 'node:crypto';

// Mock dependencies
const mockId = {
    makeId: () => 'test-id-123',
    isValidId: (id: string) => id.length > 0 && !id.includes(' ')
};

const mockMd5 = (input: string) => crypto.createHash('md5').update(input, 'utf8').digest('hex');

const mockSanitize = (input: string) => input.replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<[^>]*>/g, '').trim();

const mockIsValidIp = (ip: string) => /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);

const mockMakeSource = buildMakeSource({ isValidIp: mockIsValidIp });

const makeComment = buildMakeComment({
    Id: mockId,
    md5: mockMd5,
    sanitize: mockSanitize,
    makeSource: mockMakeSource
});

describe('Comment', () => {
    const validCommentData = {
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

    describe('Source validation', () => {
        it('should throw error for invalid IP address', () => {
            expect(() => makeComment({
                ...validCommentData,
                source: { ip: 'invalid-ip', browser: 'Chrome' }
            })).toThrow('Invalid IP address');
        });

        it('should throw error for missing browser', () => {
            expect(() => makeComment({
                ...validCommentData,
                source: { ip: '192.168.1.1', browser: '' }
            })).toThrow('Browser information is required');
        });

        it('should accept valid source with referer', () => {
            const comment = makeComment({
                ...validCommentData,
                source: {
                    ip: '192.168.1.1',
                    browser: 'Chrome 95',
                    referer: 'https://example.com'
                }
            });

            const source = comment.getSource();
            expect(source.getIp()).toBe('192.168.1.1');
            expect(source.getBrowser()).toBe('Chrome 95');
            expect(source.getReferer()).toBe('https://example.com');
        });

        it('should accept valid source without referer', () => {
            const comment = makeComment(validCommentData);
            const source = comment.getSource();

            expect(source.getIp()).toBe('192.168.1.1');
            expect(source.getBrowser()).toBe('Chrome 95');
            expect(source.getReferer()).toBeUndefined();
        });
    });
});
