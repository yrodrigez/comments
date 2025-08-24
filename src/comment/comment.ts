export default function buildMakeComment({Id, md5, sanitize, makeSource}: {
    Id: { makeId: () => string, isValidId: (id: string) => boolean },
    md5: (input: string) => string,
    sanitize: (input: string) => string,
    makeSource: (source: { ip: string, browser: string, referer?: string }) => {
        getIp: () => string,
        getBrowser: () => string,
        getReferer: () => string | undefined
    }
}) {

    return function makeComment({
                                    id = Id.makeId(),
                                    author,
                                    source,
                                    modifiedOn = new Date(),
                                    postId,
                                    published = false,
                                    replyToId,
                                    text
                                }: {
        id?: string,
        author?: string,
        source: { ip: string, browser: string, referer?: string },
        modifiedOn?: Date,
        postId: string,
        published?: boolean,
        replyToId?: string,
        text: string
    }) {

        if (!Id.isValidId(id)) {
            throw new Error('Invalid comment ID');
        }

        if (!author) {
            throw new Error('Invalid comment author');
        }

        if (!Id.isValidId(postId)) {
            throw new Error('Invalid post ID');
        }

        if (replyToId && !Id.isValidId(replyToId)) {
            throw new Error('Invalid reply-to comment ID');
        }

        const sanitizeText = sanitize(text).trim();
        if (!sanitizeText || sanitizeText.length === 0) {
            throw new Error('Comment text is required');
        }

        const validSource = makeSource(source);
        const deletedText = 'This comment has been deleted.';
        const deletedAuthor = 'deleted';
        const makeHash = () => {
            return md5(
                sanitizeText
                + published
                + (author ?? '')
                + (postId ?? '')
                + (replyToId ?? '')
            )
        }

        return Object.freeze({
            getId: () => id,
            getAuthor: () => author,
            getSource: () => validSource,
            getModifiedOn: () => modifiedOn,
            getPostId: () => postId,
            isPublished: () => published,
            getReplyToId: () => replyToId,
            getText: (includeDeletedText = false) => author ? sanitizeText : (includeDeletedText ? deletedText : ''),
            getHash: makeHash,
            markAsDeleted: () => {
                author = deletedAuthor;
                text = deletedText;
            }
        });
    }
}