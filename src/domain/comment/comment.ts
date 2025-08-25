import {type Comment, type CommentInput, type Source, type SourceInput} from "./types";

export default function buildMakeComment({Id, md5, sanitize, makeSource}: {
    Id: { makeId: () => string, isValidId: (id: string) => boolean },
    md5: (input: string) => string,
    sanitize: (input: string) => string,
    makeSource: (source: SourceInput) => Source
}) {

    return function makeComment({
                                    id = Id.makeId(),
                                    author,
                                    source,
                                    modifiedOn = new Date(),
                                    createdOn = new Date(),
                                    postId,
                                    published = false,
                                    replyToId,
                                    text
                                }: CommentInput): Comment {

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
        let hash: string;
        return Object.freeze({
            getId: () => id,
            getAuthor: () => author,
            getCreatedOn: () => createdOn,
            getSource: () => validSource,
            getModifiedOn: () => modifiedOn,
            getPostId: () => postId,
            isPublished: () => published,
            getReplyToId: () => replyToId,
            getText: (includeDeletedText = false) => author !== deletedAuthor ? sanitizeText : (includeDeletedText ? deletedText : ''),
            getHash: () => hash || (hash = makeHash()),
            markAsDeleted: () => {
                author = deletedAuthor;
                text = deletedText;
            }
        });
    }
}