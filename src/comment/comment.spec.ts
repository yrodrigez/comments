import buildMakeComment from './comment';
import buildMakeSource from './source';
import crypto from 'crypto';

// Mock dependencies
const mockId = {
    makeId: () => 'test-id-123',
    isValidId: (id: string) => id.length > 0 && !id.includes(' ')
};

const mockMd5 = (input: string) => crypto.createHash('md5').update(input, 'utf8').digest('hex');

const mockSanitize = (input: string) => input.replace(/<[^>]*>/g, '').trim();

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

        it('should create a comment with modifiedOn date', () => {
            const customDate = new Date('2023-01-01');
            const comment = makeComment({
                ...validCommentData,
                modifiedOn: customDate
            });

            expect(comment.getModifiedOn()).toBe(customDate);
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
    });

    describe('Comment validation', () => {
        it('should throw error for invalid comment ID', () => {
            expect(() => {
                makeComment({
                    ...validCommentData,
                    id: 'invalid id with spaces'
                });
            }).toThrow('Invalid comment ID');
        });

        it('should throw error for missing author', () => {
            expect(() => {
                makeComment({
                    ...validCommentData,
                    author: '' as any
                });
            }).toThrow('Invalid comment author');
        });

        it('should throw error for empty author', () => {
            expect(() => {
                makeComment({
                    ...validCommentData,
                    author: ''
                });
            }).toThrow('Invalid comment author');
        });

        it('should throw error for invalid post ID', () => {
            expect(() => {
                makeComment({
                    ...validCommentData,
                    postId: ''
                });
            }).toThrow('Invalid post ID');
        });

        it('should throw error for invalid reply-to ID', () => {
            expect(() => {
                makeComment({
                    ...validCommentData,
                    replyToId: 'invalid reply id'
                });
            }).toThrow('Invalid reply-to comment ID');
        });

        it('should throw error for empty text', () => {
            expect(() => {
                makeComment({
                    ...validCommentData,
                    text: ''
                });
            }).toThrow('Comment text is required');
        });

        it('should throw error for whitespace-only text', () => {
            expect(() => {
                makeComment({
                    ...validCommentData,
                    text: '   \n\t  '
                });
            }).toThrow('Comment text is required');
        });

        it('should sanitize HTML in text', () => {
            const comment = makeComment({
                ...validCommentData,
                text: '<script>alert("xss")</script>Hello <b>world</b>'
            });

            expect(comment.getText()).toBe('alert("xss")Hello world');
        });
    });

    describe('Source validation', () => {
        it('should throw error for invalid IP address', () => {
            expect(() => {
                makeComment({
                    ...validCommentData,
                    source: { ip: 'invalid-ip', browser: 'Chrome' }
                });
            }).toThrow('Invalid IP address');
        });

        it('should throw error for missing browser', () => {
            expect(() => {
                makeComment({
                    ...validCommentData,
                    source: { ip: '192.168.1.1', browser: '' }
                });
            }).toThrow('Browser information is required');
        });

        it('should accept valid source with referer', () => {
            const comment = makeComment({
                ...validCommentData,
                source: {
                    ip: '192.168.1.1',
                    browser: 'Firefox',
                    referer: 'https://example.com'
                }
            });

            const source = comment.getSource();
            expect(source.getIp()).toBe('192.168.1.1');
            expect(source.getBrowser()).toBe('Firefox');
            expect(source.getReferer()).toBe('https://example.com');
        });

        it('should handle source without referer', () => {
            const comment = makeComment(validCommentData);
            const source = comment.getSource();

            expect(source.getReferer()).toBeUndefined();
        });
    });

    describe('Comment hash', () => {
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

        it('should include published status in hash', () => {
            const comment1 = makeComment({ ...validCommentData, published: false });
            const comment2 = makeComment({ ...validCommentData, published: true });

            expect(comment1.getHash()).not.toBe(comment2.getHash());
        });

        it('should include replyToId in hash', () => {
            const comment1 = makeComment(validCommentData);
            const comment2 = makeComment({
                ...validCommentData,
                replyToId: 'parent-id'
            });

            expect(comment1.getHash()).not.toBe(comment2.getHash());
        });
    });

    describe('Comment deletion', () => {
        it('should mark comment as deleted', () => {
            const comment = makeComment(validCommentData);

            comment.markAsDeleted();

            expect(comment.getAuthor()).toBe('deleted');
            expect(comment.getText()).toBe('This is a test comment'); // Author is 'deleted', not null
        });

        it('should return deleted text when includeDeletedText is true', () => {
            const comment = makeComment(validCommentData);

            comment.markAsDeleted();

            expect(comment.getText(true)).toBe('This is a test comment'); // Author is 'deleted', not null
        });

        it('should not return text content for deleted comment by default', () => {
            const comment = makeComment(validCommentData);

            comment.markAsDeleted();

            expect(comment.getText()).toBe('This is a test comment'); // Author is 'deleted', not null
            expect(comment.getText(false)).toBe('This is a test comment');
        });
    });

    describe('Comment immutability', () => {
        it('should return a frozen object', () => {
            const comment = makeComment(validCommentData);

            expect(Object.isFrozen(comment)).toBe(true);
        });

        it('should not allow modification of comment properties', () => {
            const comment = makeComment(validCommentData);

            // These should throw in strict mode because the object is frozen
            expect(() => {
                (comment as any).getId = () => 'modified-id';
            }).toThrow();

            expect(comment.getId()).toBe('test-id-123'); // Should remain unchanged
        });
    });

    describe('Edge cases', () => {
        it('should handle very long text', () => {
            const longText = 'a'.repeat(10000);
            const comment = makeComment({
                ...validCommentData,
                text: longText
            });

            expect(comment.getText()).toBe(longText);
        });

        it('should handle special characters in text', () => {
            const specialText = 'Hello! @#$%^&*()_+ 你好 🚀';
            const comment = makeComment({
                ...validCommentData,
                text: specialText
            });

            expect(comment.getText()).toBe(specialText);
        });

        it('should handle boundary IP addresses', () => {
            const comment1 = makeComment({
                ...validCommentData,
                source: { ip: '0.0.0.0', browser: 'Chrome' }
            });

            const comment2 = makeComment({
                ...validCommentData,
                source: { ip: '255.255.255.255', browser: 'Chrome' }
            });

            expect(comment1.getSource().getIp()).toBe('0.0.0.0');
            expect(comment2.getSource().getIp()).toBe('255.255.255.255');
        });

        it('should handle future dates', () => {
            const futureDate = new Date('2030-12-31');
            const comment = makeComment({
                ...validCommentData,
                modifiedOn: futureDate
            });

            expect(comment.getModifiedOn()).toBe(futureDate);
        });
    });
});
